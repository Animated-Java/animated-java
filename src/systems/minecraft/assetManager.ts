import { PACKAGE } from '../../constants'
import { getCurrentVersion, getLatestVersion } from './versionManager'
import { events } from '../../util/events'

import index from '../../assets/vanillaAssetOverrides/index.json'
import { Unzipped } from 'fflate'
import { unzip } from '../util'
import download from 'download'
import {
	showOfflineError,
	updateLoadingProgress,
	updateLoadingProgressLabel,
} from '../../interface/popup/animatedJavaLoading'
const ASSET_OVERRIDES = index as unknown as Record<string, string>

async function downloadJar(url: string, savePath: string) {
	updateLoadingProgressLabel('Downloading Minecraft Assets...')

	const data = await download(url, { retry: { retries: 3 } })
		.on('downloadProgress', progress => {
			updateLoadingProgress(progress.percent * 100)
		})
		.catch((error: any) => {
			console.error('Failed to download Minecraft client:', error)
		})

	if (!data) {
		showOfflineError()
		throw new Error('Failed to download Minecraft client after 3 retries.')
	}

	await fs.promises.writeFile(savePath, data)
}

export async function getLatestVersionClientDownloadUrl() {
	let retries = 3
	const version = await getLatestVersion()

	retries = 3
	while (retries-- >= 0) {
		let response: Response | undefined
		try {
			response = await fetch(version.url)
		} catch (error) {
			console.error('Failed to fetch latest Minecraft version API:', error)
		}
		if (response && response.ok) {
			const result = await response.json()
			if (!result?.downloads?.client) {
				throw new Error(`Failed to find client download for ${version.id}`)
			}
			return result.downloads.client.url as string
		}
	}
	throw new Error('Failed to fetch latest Minecraft version API after 3 retries.')
}

function getCachedJarFilePath() {
	const userDataPath = electron.app.getPath('userData')
	return PathModule.join(userDataPath, `${PACKAGE.name}/latest.jar`)
}

export async function updateAssets() {
	localStorage.setItem('assetsLoaded', 'false')

	const downloadUrl = await getLatestVersionClientDownloadUrl()
	console.log('Downloading latest Minecraft client:', downloadUrl)

	const cachedJarFilePath = getCachedJarFilePath()
	await fs.promises.mkdir(PathModule.dirname(cachedJarFilePath), { recursive: true })
	await downloadJar(downloadUrl, cachedJarFilePath)
	console.log('Downloaded latest Minecraft client:', cachedJarFilePath)
}

export async function checkForAssetsUpdate() {
	console.log('Checking for Minecraft assets update...')

	const currentVersion = getCurrentVersion()
	if (!currentVersion) {
		console.log('No current Minecraft version found, updating assets...')
		await updateAssets()
	} else {
		const latestVersion = await getLatestVersion()
		if (currentVersion.id !== latestVersion.id) {
			console.log('Minecraft assets are outdated, updating...')
			await updateAssets()
		}
	}

	const cachedJarFilePath = getCachedJarFilePath()
	if (!fs.existsSync(cachedJarFilePath) || !(localStorage.getItem('assetsLoaded') === 'true')) {
		console.log('No cached Minecraft client found, updating assets...')
		await updateAssets()
	}

	console.log('Does file exist?', fs.existsSync(cachedJarFilePath))
	console.log('Are assets loaded?', localStorage.getItem('assetsLoaded') === 'true')

	await extractAssets()
	console.log('Minecraft assets are up to date!')
	localStorage.setItem('assetsLoaded', 'true')
	requestAnimationFrame(() => events.MINECRAFT_ASSETS_LOADED.dispatch())
}

let loadedAssets: Unzipped | undefined
export async function extractAssets() {
	const cachedJarFilePath = getCachedJarFilePath()

	loadedAssets = await unzip(new Uint8Array(await fs.promises.readFile(cachedJarFilePath)), {
		filter: v => v.name.startsWith('assets/'),
	})
}

export async function assetsLoaded() {
	return new Promise<void>(resolve => {
		if (loadedAssets !== undefined) {
			resolve()
		} else {
			events.MINECRAFT_ASSETS_LOADED.subscribe(() => resolve(), true)
		}
	})
}

export function hasAsset(path: string) {
	if (!loadedAssets) throw new Error('Assets not loaded')
	return !!loadedAssets[path]
}

export function getRawAsset(path: string) {
	if (!loadedAssets) throw new Error('Assets not loaded')

	if (ASSET_OVERRIDES[path]) {
		if (path.endsWith('.png')) {
			return Buffer.from(ASSET_OVERRIDES[path], 'base64')
		}
		return ASSET_OVERRIDES[path]
	}

	const asset = loadedAssets[path]
	if (!asset) throw new Error(`Asset not found: ${path}`)
	return asset
}

export function getPngAssetAsDataUrl(path: string) {
	const asset = getRawAsset(path)
	if (!asset) throw new Error(`Asset not found: ${path}`)
	return `data:image/png;base64,${Buffer.from(asset).toString('base64')}`
}

export function getJSONAsset(path: string): any {
	const asset = getRawAsset(path)
	if (!asset) throw new Error(`Asset not found: ${path}`)
	const json = JSON.parse(Buffer.from(asset).toString('utf-8'))
	return json
}
