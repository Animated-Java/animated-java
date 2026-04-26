import type { Unzipped } from 'fflate'
import ky from 'ky'
import { dirname, join } from 'node:path'
import { getFsModule } from '../../constants'
import { unzip } from '../util'
import { getVersionById, getVersionDownloadUrl } from './versionManager'

const CLIENT_JAR_FOLDER = join(SystemInfo.user_data_directory, `animated_java/client_jars`)

const ASSETS_CACHE = new Map<string, Unzipped>()
const FOLDER_CACHE = new Map<string, Record<string, Buffer>>()
const ACTIVE_DOWNLOAD_PROMISES = new Map<string, Promise<void>>()

async function downloadFile(url: string, savePath: string) {
	const response = await ky(url, {
		method: 'GET',
		onDownloadProgress(progress) {
			Blockbench.setStatusBarText('Downloading Minecraft Assets...')
			Blockbench.setProgress(progress.percent)
		},
	})

	setTimeout(() => {
		Blockbench.setStatusBarText()
		Blockbench.setProgress(0, 0)
	}, 5000)

	if (!response.ok) {
		throw new Error(`Failed to download file from ${url}: ${response.statusText}`)
	}

	const data = new Uint8Array(await response.arrayBuffer())

	const { mkdir, writeFile } = getFsModule().promises

	await mkdir(dirname(savePath), { recursive: true })
	await writeFile(savePath, data)
}

export async function getAssets(versionId: string) {
	if (ASSETS_CACHE.has(versionId)) {
		return ASSETS_CACHE.get(versionId)!
	}

	const manifest = await getVersionById(versionId)

	const jarPath = join(CLIENT_JAR_FOLDER, `${manifest.id}.jar`)

	const clientDownloadUrl = await getVersionDownloadUrl(manifest.id)

	const { existsSync, promises } = getFsModule()
	const { readFile } = promises

	if (ACTIVE_DOWNLOAD_PROMISES.has(manifest.id)) {
		await ACTIVE_DOWNLOAD_PROMISES.get(manifest.id)!
	} else if (!existsSync(jarPath)) {
		const downloadPromise = downloadFile(clientDownloadUrl, jarPath)
		ACTIVE_DOWNLOAD_PROMISES.set(manifest.id, downloadPromise)
		try {
			await downloadPromise
		} finally {
			ACTIVE_DOWNLOAD_PROMISES.delete(manifest.id)
		}
	}

	const buffer = await readFile(jarPath)

	const loadedAssets = await unzip(new Uint8Array(buffer), {
		filter: v => v.name.startsWith('assets/'),
	})

	ASSETS_CACHE.set(versionId, loadedAssets)
	return loadedAssets
}

export async function hasAsset(versionId: string, assetPath: string) {
	const assets = await getAssets(versionId)
	return assetPath in assets
}

export async function getRawAsset(versionId: string, assetPath: string) {
	const assets = await getAssets(versionId)
	const asset = assets[assetPath]
	if (!asset) {
		throw new Error(`Asset '${assetPath}' not found in Minecraft ${versionId} client jar!`)
	}
	return Buffer.from(asset)
}

/**
 * Gets a PNG asset as a data URL for a specific Minecraft version.
 */
export async function getPngAsset(versionId: string, assetPath: string) {
	const asset = await getRawAsset(versionId, assetPath)
	if (!asset) {
		throw new Error(`Asset '${assetPath}' not found in Minecraft ${versionId} client jar!`)
	}
	return `data:image/png;base64,${asset.toString('base64')}`
}

export async function getJSONAsset(versionId: string, assetPath: string) {
	const asset = await getRawAsset(versionId, assetPath)
	if (!asset) {
		throw new Error(`Asset '${assetPath}' not found in Minecraft ${versionId} client jar!`)
	}
	return JSON.parse(asset.toString('utf-8'))
}

export async function getFolder(versionId: string, folderPath: string) {
	const cacheKey = `${versionId}:${folderPath}`
	if (FOLDER_CACHE.has(cacheKey)) {
		return FOLDER_CACHE.get(cacheKey)!
	}

	const assets = await getAssets(versionId)
	const folderAssets: Record<string, Buffer> = {}
	for (const assetPath in assets) {
		if (assetPath.startsWith(folderPath)) {
			folderAssets[assetPath] = Buffer.from(assets[assetPath])
		}
	}

	FOLDER_CACHE.set(cacheKey, folderAssets)
	return folderAssets
}

export async function filterAssets(versionId: string, predicate: (assetPath: string) => boolean) {
	const assets = await getAssets(versionId)
	return Object.keys(assets).filter(predicate)
}
