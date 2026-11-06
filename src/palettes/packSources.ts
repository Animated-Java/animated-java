import { getUsableAtlases, readDiskFile, readPackAtlases } from './host'
import type { IPalettedPermutationsSource } from './types'

export interface IFoundSource {
	/** The atlas the source is in, like `blocks`. */
	atlas: string
	source: IPalettedPermutationsSource
	/** The atlas file on disk it came from, if it wasn't found in vanilla or the Preview packs. */
	file?: string
}

function isPalettedSource(source: unknown): source is IPalettedPermutationsSource {
	const s = source as Partial<IPalettedPermutationsSource> | undefined
	return (
		typeof s?.type === 'string' &&
		s.type.replace(/^minecraft:/, '') === 'paletted_permutations' &&
		Array.isArray(s.textures) &&
		typeof s.palette_key === 'string' &&
		typeof s.permutations === 'object'
	)
}

/** Every `paletted_permutations` source in the atlases item models can use, from vanilla and the
 * Preview resource packs. */
export async function findPackSources(): Promise<IFoundSource[]> {
	const found: IFoundSource[] = []
	for (const atlas of getUsableAtlases()) {
		for (const file of await readPackAtlases(atlas).catch(() => [])) {
			for (const source of file.sources ?? []) {
				if (isPalettedSource(source)) found.push({ atlas, source })
			}
		}
	}
	return found
}

export type AtlasFileResult =
	| { ok: true; sources: IFoundSource[] }
	| { ok: false; error: 'unreadable' | 'not_an_atlas' | 'unusable_atlas'; atlas?: string }

/**
 * Reads the `paletted_permutations` sources from an atlas file on disk, like
 * `<pack>/assets/minecraft/atlases/blocks.json`. Only atlases item models can use are accepted.
 */
export async function readAtlasFile(file: string): Promise<AtlasFileResult> {
	const match = /[\\/]assets[\\/]minecraft[\\/]atlases[\\/]([^\\/]+)\.json$/.exec(file)
	if (!match) return { ok: false, error: 'not_an_atlas' }
	const atlas = match[1]
	if (!getUsableAtlases().includes(atlas)) return { ok: false, error: 'unusable_atlas', atlas }

	const bytes = await readDiskFile(file)
	let json: { sources?: unknown[] } | undefined
	try {
		json = bytes && JSON.parse(new TextDecoder().decode(bytes))
	} catch {
		json = undefined
	}
	if (!json || !Array.isArray(json.sources)) return { ok: false, error: 'unreadable' }

	return {
		ok: true,
		sources: json.sources.filter(isPalettedSource).map(source => ({ atlas, source, file })),
	}
}

/** Every palette id used by `sources`, keys first, without duplicates. */
export function getPaletteIds(sources: IFoundSource[]): string[] {
	const keys = sources.map(found => found.source.palette_key)
	const palettes = sources.flatMap(found => Object.values(found.source.permutations))
	return [...new Set([...keys, ...palettes])]
}
