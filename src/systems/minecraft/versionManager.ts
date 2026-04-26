import ky from 'ky'

export const VERSION_MANIFEST_URL =
	'https://launchermeta.mojang.com/mc/game/version_manifest_v2.json'

const MISODE_VERSION_URL =
	'https://raw.githubusercontent.com/misode/mcmeta/refs/tags/$$VERSION$$-summary/version.json'

interface IMinecraftVersion {
	id: string
	type: 'snapshot' | 'release'
	url: string
	time: string
	releaseTime: string
	sha1: string
	complianceLevel: number
}

interface MisodeVersion {
	id: string
	name: string
	release_target: unknown
	type: 'release' | 'snapshot'
	stable: boolean
	data_version: number
	protocol_version: number
	data_pack_version: number
	data_pack_version_minor: number
	resource_pack_version: number
	resource_pack_version_minor: number
	build_time: string
	release_time: string
	sha1: string
}

export interface IMinecraftVersionManifest {
	latest: {
		release: string
		snapshot: string
	}
	versions: IMinecraftVersion[]
}

const VERSION_CACHE = new Map<string, IMinecraftVersion>()
const CLIENT_JAR_DOWNLOAD_URL_CACHE = new Map<string, string>()
const MISODE_VERSION_CACHE = new Map<string, MisodeVersion>()

export async function getMisodeVersion(versionId: string) {
	if (MISODE_VERSION_CACHE.has(versionId)) {
		return MISODE_VERSION_CACHE.get(versionId)!
	}
	const response = await ky<MisodeVersion>(
		MISODE_VERSION_URL.replace('$$VERSION$$', versionId)
	).json()
	MISODE_VERSION_CACHE.set(versionId, response)
	return response
}

export async function getLatestVersion() {
	if (!window.navigator.onLine) {
		throw new Error('No internet connection, and no previous latest version cached!')
	}
	let response: Response | undefined
	try {
		response = await ky(VERSION_MANIFEST_URL)
	} catch (error: any) {
		throw new Error(
			`Failed to fetch latest Minecraft version manifest: ${error.message as string}`
		)
	}
	if (response?.ok) {
		const result: IMinecraftVersionManifest = await response.json()
		const version = result.versions.find(
			(v: IMinecraftVersion) => v.id === result.latest.snapshot
		)
		if (!version) {
			throw new Error(`Failed to find version data for '${result.latest.snapshot}'`)
		}
		return version
	}
	throw new Error('Failed to fetch latest Minecraft version manifest.')
}

export async function getVersionById(versionId: string) {
	if (VERSION_CACHE.has(versionId)) {
		return VERSION_CACHE.get(versionId)!
	}
	if (!window.navigator.onLine) {
		throw new Error('No internet connection, cannot fetch Minecraft version data!')
	}
	let response: Response | undefined
	try {
		response = await ky(VERSION_MANIFEST_URL)
	} catch (error: any) {
		throw new Error(
			`Failed to fetch Minecraft ${versionId} version manifest: ${error.message as string}`
		)
	}
	if (response?.ok) {
		const result: IMinecraftVersionManifest = await response.json()
		const version = result.versions.find((v: IMinecraftVersion) => v.id === versionId)
		if (!version) {
			throw new Error(`Unknown Minecraft version '${versionId}'`)
		}
		return version
	}
	throw new Error(`Failed to fetch Minecraft ${versionId} version manifest.`)
}

export async function getVersionDownloadUrl(versionId: string) {
	if (CLIENT_JAR_DOWNLOAD_URL_CACHE.has(versionId)) {
		return CLIENT_JAR_DOWNLOAD_URL_CACHE.get(versionId)!
	}

	const manifest = await getVersionById(versionId)

	const response = await ky<{ downloads: { client: { url: string } } }>(manifest.url).json()
	if (!response?.downloads?.client) {
		throw new Error(`Failed to find client download for ${manifest.id}`)
	}
	const clientDownloadUrl = response.downloads.client.url

	CLIENT_JAR_DOWNLOAD_URL_CACHE.set(versionId, clientDownloadUrl)
	return clientDownloadUrl
}
