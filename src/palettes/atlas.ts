import type { IPalettedPermutationsSource } from './types'

/** First Minecraft version that reads a `paletted_permutations` source's `separator`. */
export const SEPARATOR_MIN_VERSION = '1.21.5'

/** First Minecraft version that resolves palette ids under `textures/palettes/`. */
export const PALETTES_FOLDER_MIN_VERSION = '26.3'

export const DEFAULT_SEPARATOR = '_'

const isAtLeast = (version: string, minimum: string) => !compareVersions(minimum, version)

function splitId(id: string): [string, string] {
	const index = id.indexOf(':')
	return index === -1 ? ['minecraft', id] : [id.slice(0, index), id.slice(index + 1)]
}

/** The pack path of a texture id's image, like `assets/minecraft/textures/block/stone.png`. */
export function getTextureImagePath(id: string): string {
	const [namespace, path] = splitId(id)
	return `assets/${namespace}/textures/${path}.png`
}

/**
 * The pack path a palette id's image is read from on `version`. Before 26.3 palette ids resolve
 * like texture ids; from 26.3 they resolve under `textures/palettes/`.
 */
export function getPaletteImagePath(id: string, version: string): string {
	if (!isAtLeast(version, PALETTES_FOLDER_MIN_VERSION)) return getTextureImagePath(id)
	const [namespace, path] = splitId(id)
	return `assets/${namespace}/textures/palettes/${path}.png`
}

/**
 * The palette id for an image at `assets/<namespace>/textures/palettes/<path>.png`. Writing palettes
 * there works on every version; only the id changes.
 */
export function getPaletteId(namespace: string, path: string, version: string): string {
	return isAtLeast(version, PALETTES_FOLDER_MIN_VERSION)
		? `${namespace}:${path}`
		: `${namespace}:palettes/${path}`
}

export function getSpriteId(baseId: string, separator: string, suffix: string): string {
	return baseId + separator + suffix
}

/** Builds the atlas source for a set, leaving out `separator` when it's the default. */
export function buildAtlasSource(options: {
	bases: string[]
	separator: string
	key: string
	permutations: Record<string, string>
}): IPalettedPermutationsSource {
	const source: IPalettedPermutationsSource = {
		type: 'paletted_permutations',
		textures: options.bases,
		palette_key: options.key,
		permutations: options.permutations,
	}
	if (options.separator !== DEFAULT_SEPARATOR) source.separator = options.separator
	return source
}

export function supportsSeparator(version: string): boolean {
	return isAtLeast(version, SEPARATOR_MIN_VERSION)
}
