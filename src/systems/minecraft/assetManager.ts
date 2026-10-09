import type { Unzipped } from 'fflate'
import ky from 'ky'
import { createHash } from 'node:crypto'
import { dirname, join } from 'node:path'
import { getFsModule } from '../../constants'
import { resolvePath } from '../../util/fileUtil'
import { unzip } from '../util'
import { getVersionById, getVersionDownloadUrl } from './versionManager'

const CLIENT_JAR_FOLDER = join(SystemInfo.user_data_directory, `animated_java/client_jars`)

const ASSETS_CACHE = new Map<string, Unzipped>()
const FOLDER_CACHE = new Map<string, Record<string, Buffer>>()
const ACTIVE_DOWNLOAD_PROMISES = new Map<string, Promise<void>>()

// region Preview Resource Pack
/**
 * A merged in-memory overlay of the `assets/` trees of one or more user-provided
 * resource packs. When present, its files take precedence over the vanilla client
 * jar for every asset lookup, letting the editor preview custom fonts, models,
 * and textures without exporting.
 */
let previewPack: Map<string, Uint8Array> | undefined
/**
 * The individual preview pack overlays, highest priority first. Kept alongside the
 * flattened {@link previewPack} for assets that stack rather than replace (fonts).
 */
let previewPackLayers: Array<Map<string, Uint8Array>> = []
/**
 * A cache-busting token that changes whenever the preview resource pack overlay
 * changes. Downstream caches (bmr asset bundles, model/font caches) mix this into
 * their keys so a swapped pack keeps no stale renders.
 */
let previewPackKey = ''

export function getPreviewResourcePackKey(): string {
	return previewPackKey
}

export function isPreviewResourcePackLoaded(): boolean {
	return previewPack !== undefined
}

async function walkPreviewFolder(
	root: string,
	relativeDir: string,
	into: Map<string, Uint8Array>,
	signature: string[]
) {
	const { promises } = getFsModule()
	const entries = await promises.readdir(join(root, relativeDir), { withFileTypes: true })
	for (const entry of entries) {
		const relativePath = relativeDir ? `${relativeDir}/${entry.name}` : entry.name
		const absolutePath = join(root, relativePath)
		if (entry.isDirectory()) {
			await walkPreviewFolder(root, relativePath, into, signature)
		} else if (entry.isFile()) {
			const [data, stat] = await Promise.all([
				promises.readFile(absolutePath),
				promises.stat(absolutePath),
			])
			const key = relativePath.replace(/\\/g, '/')
			into.set(key, new Uint8Array(data))
			signature.push(`${key}:${stat.size}:${stat.mtimeMs}`)
		}
	}
}

/** Loads one resource pack (folder or `.zip`) into its own `assets/`-only overlay. */
async function loadOnePreviewPack(
	path: string
): Promise<{ entries: Map<string, Uint8Array>; signature: string }> {
	const { existsSync, promises } = getFsModule()
	const resolved = resolvePath(path)

	if (!existsSync(resolved)) {
		throw new Error(`Preview resource pack does not exist at '${resolved}'`)
	}

	const entries = new Map<string, Uint8Array>()

	// A `.zip` path is a zipped pack; anything else is treated as a pack folder.
	if (/\.zip$/i.test(resolved)) {
		const bytes = new Uint8Array(await promises.readFile(resolved))
		const unzipped = await unzip(bytes, {
			filter: v => v.name.startsWith('assets/'),
		})
		for (const [name, data] of Object.entries(unzipped)) {
			entries.set(name, data)
		}
		const digest = createHash('sha1').update(bytes).digest('hex')
		return { entries, signature: `zip:${resolved}:${digest}` }
	}

	const parts: string[] = []
	if (existsSync(join(resolved, 'assets'))) {
		await walkPreviewFolder(resolved, 'assets', entries, parts)
	}
	parts.sort()
	const digest = createHash('sha1').update(parts.join('|')).digest('hex')
	return { entries, signature: `dir:${resolved}:${digest}` }
}

/**
 * Loads (or, given an empty list, clears) the preview resource pack overlay.
 * Packs are listed highest priority first: earlier entries override later ones,
 * and all of them override the vanilla client jar.
 */
export async function setPreviewResourcePacks(paths: string[]): Promise<void> {
	const cleaned = paths.map(p => p.trim()).filter(Boolean)

	if (cleaned.length === 0) {
		previewPack = undefined
		previewPackLayers = []
		previewPackKey = ''
		return
	}

	const loaded = await Promise.all(cleaned.map(loadOnePreviewPack))

	previewPackLayers = loaded.map(l => l.entries)

	// Merge lowest priority first so higher-priority packs (earlier in the list) win.
	const overlay = new Map<string, Uint8Array>()
	for (const { entries } of [...loaded].reverse()) {
		for (const [key, data] of entries) overlay.set(key, data)
	}

	previewPack = overlay
	previewPackKey = loaded.map(l => l.signature).join('\n')
}

function readPreviewAsset(assetPath: string): Uint8Array | undefined {
	return previewPack?.get(assetPath)
}

/**
 * Every layer's copy of an asset, highest priority first: each preview pack that
 * has it, then the vanilla client jar. Used for assets that stack instead of
 * replace (font definitions merge their `providers` across packs).
 */
export async function getAllRawAssets(versionId: string, assetPath: string): Promise<Buffer[]> {
	const results: Buffer[] = []
	for (const layer of previewPackLayers) {
		const data = layer.get(assetPath)
		if (data) results.push(Buffer.from(data))
	}
	const jarAsset = (await getAssets(versionId))[assetPath]
	if (jarAsset) results.push(Buffer.from(jarAsset))
	return results
}

/** {@link getAllRawAssets}, parsed as JSON. */
export async function getAllJSONAssets(versionId: string, assetPath: string): Promise<any[]> {
	const buffers = await getAllRawAssets(versionId, assetPath)
	return buffers.map(buffer => JSON.parse(buffer.toString('utf-8')))
}
// endregion

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

/** A `block-model-renderer` virtual asset handler over a version's client jar. */
export const getAssetHandler = async (versionId: string) => {
	const assets = await getAssets(versionId)
	const paths = new Set(Object.keys(assets))
	if (previewPack) {
		for (const key of previewPack.keys()) paths.add(key)
	}
	return {
		read(filePath: string): Uint8Array | null {
			return readPreviewAsset(filePath) ?? assets[filePath] ?? null
		},
		list(dir: string): string[] {
			const prefix = dir.endsWith('/') ? dir : dir + '/'
			const children = new Set<string>()
			for (const path of paths) {
				if (!path.startsWith(prefix)) continue
				const rest = path.slice(prefix.length)
				const slash = rest.indexOf('/')
				children.add(slash === -1 ? rest : rest.slice(0, slash))
			}
			return [...children]
		},
		filter: [] as unknown[],
	}
}

export async function hasAsset(versionId: string, assetPath: string) {
	if (previewPack?.has(assetPath)) return true
	const assets = await getAssets(versionId)
	return assetPath in assets
}

export async function getRawAsset(versionId: string, assetPath: string) {
	const previewAsset = readPreviewAsset(assetPath)
	if (previewAsset) return Buffer.from(previewAsset)

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
	const cacheKey = `${versionId}:${previewPackKey}:${folderPath}`
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
	if (previewPack) {
		for (const [assetPath, data] of previewPack) {
			if (assetPath.startsWith(folderPath)) {
				folderAssets[assetPath] = Buffer.from(data)
			}
		}
	}

	FOLDER_CACHE.set(cacheKey, folderAssets)
	return folderAssets
}

export async function filterAssets(versionId: string, predicate: (assetPath: string) => boolean) {
	const assets = await getAssets(versionId)
	const keys = new Set(Object.keys(assets))
	if (previewPack) {
		for (const key of previewPack.keys()) keys.add(key)
	}
	return [...keys].filter(predicate)
}
