import { PACKAGE } from '../../constants'
import { type AsyncUnzipOptions, type Unzipped, unzip as cpUnzip } from 'fflate/browser'
import { getCurrentVersion, getLatestVersion } from './versionManager'
import { events } from '../../util/events'

// const VERSION_MANIFEST_URL = 'https://launchermeta.mojang.com/mc/game/version_manifest_v2.json'
// promisify didn't work 😔
const unzip = (data: Uint8Array, options: AsyncUnzipOptions) => {
	return new Promise<Unzipped>((resolve, reject) => {
		cpUnzip(data, options, (err, result) => {
			if (err) {
				reject(err)
			} else {
				resolve(result)
			}
		})
	})
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
	const downloadUrl = await getLatestVersionClientDownloadUrl()
	console.log('Downloading latest Minecraft client:', downloadUrl)
	const response = await fetch(downloadUrl)

	const cachedJarFilePath = getCachedJarFilePath()
	await fs.promises.mkdir(PathModule.dirname(cachedJarFilePath), { recursive: true })
	const data = new Uint8Array(await response.arrayBuffer())
	await fs.promises.writeFile(cachedJarFilePath, data)
	console.log('Downloaded latest Minecraft client:', cachedJarFilePath)
}

export async function checkForAssetsUpdate() {
	console.log('Checking for Minecraft assets update...')
	// DEBUG
	// await updateAssets()

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

	await extractAssets()
	console.log('Minecraft assets are up to date!')
	events.MINECRAFT_ASSETS_LOADED.dispatch()
}

let loadedAssets: Unzipped | undefined
export async function extractAssets() {
	const cachedJarFilePath = getCachedJarFilePath()

	loadedAssets = await unzip(new Uint8Array(await fs.promises.readFile(cachedJarFilePath)), {
		filter: v => v.name.startsWith('assets/'),
	})
}

export function getRawAsset(path: string) {
	if (!loadedAssets) throw new Error('Assets not loaded')
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
