import MCB_SOURCES from 'mcb-sources:./'

// The core is content that always goes in the `data` folder directly,
// while other files are in the `animated_java/data` folder to be overlayed when the correct version is loaded.

interface MCBFiles {
	main: string
	global: string
	globalTemplates: string
}

const MCB_FIELDS = ['main', 'global', 'globalTemplates'] as const

/**
 * Resolves the MC-Build source files for a target Minecraft version.
 *
 * Every version directory under `src/systems/datapackCompiler/` is discovered
 * automatically (see `mcbCompressionPlugin`). Each field is resolved on its own
 * to the newest directory that is `<=` the target version and actually provides
 * that file, so a new version only needs a directory containing what changed.
 */
export function getMCBFilesByVersion(version: string): MCBFiles {
	const candidates = Object.keys(MCB_SOURCES)
		.filter(sourceVersion => VersionUtil.compare(sourceVersion, '<=', version))
		.sort((a, b) => VersionUtil.compare(a, b))

	if (candidates.length === 0) {
		throw new Error(`Unsupported Minecraft version: ${version}`)
	}

	const resolved = {} as MCBFiles

	for (const field of MCB_FIELDS) {
		for (let i = candidates.length - 1; i >= 0; i--) {
			const content = MCB_SOURCES[candidates[i]][field]
			if (content !== undefined) {
				resolved[field] = content
				break
			}
		}

		if (resolved[field] === undefined) {
			throw new Error(
				`No "${field}" MC-Build source available for Minecraft version ${version}`
			)
		}
	}

	return resolved
}
