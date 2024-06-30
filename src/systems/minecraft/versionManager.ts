export const VERSION_MANIFEST_URL =
	'https://launchermeta.mojang.com/mc/game/version_manifest_v2.json'

interface IMinecraftVersion {
	id: string
	type: 'snapshot' | 'release'
	url: string
	time: string
	releaseTime: string
	sha1: string
	complianceLevel: number
}

export interface IMinecraftVersionManifest {
	latest: {
		release: string
		snapshot: string
	}
	versions: IMinecraftVersion[]
}

let latestMinecraftVersion: IMinecraftVersion | undefined
export async function getLatestVersion() {
	if (latestMinecraftVersion) return latestMinecraftVersion
	if (!window.navigator.onLine) {
		console.warn('Not connected to the internet! Using last known latest version.')
		latestMinecraftVersion = getCurrentVersion()
		if (!latestMinecraftVersion)
			throw new Error('No internet connection, and no previous latest version cached!')
		return latestMinecraftVersion
	}
	let response: Response | undefined
	try {
		response = await fetch(VERSION_MANIFEST_URL)
	} catch (error: any) {
		throw new Error(
			`Failed to fetch latest Minecraft version manifest: ${error.message as string}`
		)
	}
	if (response && response.ok) {
		const result: IMinecraftVersionManifest = await response.json()
		const version = result.versions.find(
			(v: IMinecraftVersion) => v.id === result.latest.snapshot
		)
		if (!version) {
			throw new Error(`Failed to find version data for '${result.latest.snapshot}'`)
		}
		latestMinecraftVersion = version
		localStorage.setItem('animated_java:minecraftVersion', JSON.stringify(version))
		return version
	}
	throw new Error('Failed to fetch latest Minecraft version manifest.')
}

export function getCurrentVersion() {
	const stringVersion = localStorage.getItem('animated_java:minecraftVersion')
	if (!stringVersion) return undefined
	return JSON.parse(stringVersion) as IMinecraftVersion
}
