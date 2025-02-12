type SingleLetter =
	| 'a'
	| 'b'
	| 'c'
	| 'd'
	| 'e'
	| 'f'
	| 'g'
	| 'h'
	| 'i'
	| 'j'
	| 'k'
	| 'l'
	| 'm'
	| 'n'
	| 'o'
	| 'p'
	| 'q'
	| 'r'
	| 's'
	| 't'
	| 'u'
	| 'v'
	| 'w'
	| 'x'
	| 'y'
	| 'z'

namespace MinecraftVersion {
	export type AlphaVersionString = `a${string}`
	export type SnapshotVersionString = `${number}w${number}${SingleLetter}`
	export type PreReleaseVersionString = `${number}.${number}.pre${number}`
	export type ReleaseVersionString = `${number}.${number}.${number}`
	export type VersionString =
		| ReleaseVersionString
		| SnapshotVersionString
		| PreReleaseVersionString
		| AlphaVersionString
	export type VersionType = 'release' | 'snapshot' | 'old_beta' | 'old_alpha'

	export type VersionData = {
		url: string
		time: string
		releaseTime: string
		sha1: string
		complianceLevel: number
	} & (
		| {
				id: AlphaVersionString
				type: 'old_alpha'
		  }
		| {
				id: SnapshotVersionString
				type: 'snapshot'
		  }
		| {
				id: PreReleaseVersionString
				type: 'old_beta'
		  }
		| {
				id: ReleaseVersionString
				type: 'release'
		  }
	)

	export interface IMinecraftVersionManifest {
		latest: {
			release: MinecraftVersion.ReleaseVersionString
			snapshot: MinecraftVersion.SnapshotVersionString
		}
		versions: VersionData[]
	}
}

class VersionManager {
	get latestVersion() {
		return
	}
	set latestVerison(value: MinecraftVersion.VersionString) {}
}
