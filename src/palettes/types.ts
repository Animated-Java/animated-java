import type { PaletteColors } from './recolor'

/** A palette key or palette: colors stored in the set, or a resource in a pack. */
export interface IPaletteStrip {
	colors?: PaletteColors
	/** Palette id, as an atlas source writes it for the blueprint's target version. */
	id?: string
}

export interface IPalettePermutation {
	uuid: string
	suffix: string
	strip: IPaletteStrip
}

/** Where a referenced set's atlas source came from. */
export interface IPaletteReference {
	/** The atlas the source is in, like `blocks`. */
	atlas: string
	/** An atlas file picked from disk. Unset for sources found in vanilla or the Preview packs. */
	file?: string
	/** {@link file}, relative to the blueprint when it was picked. Used if `file` goes missing. */
	relative_file?: string
	/**
	 * Asset path -> PNG data URL of each image the set used from {@link file}'s pack, saved when it
	 * was picked. Previews fall back to these if the pack can't be found.
	 */
	images?: Record<string, string>
}

/**
 * A Permutation Set, stored on its Texture. A project set's `bases` are texture UUIDs. A reference
 * set's `bases` are texture ids and every strip is an `id`, since it points at a source that
 * already exists in a pack.
 */
export interface IPaletteSetData {
	separator: string
	bases: string[]
	key: IPaletteStrip
	permutations: IPalettePermutation[]
	reference?: IPaletteReference
}

/** What a generated texture is a recolor of. */
export interface IGeneratedTextureData {
	/** UUID of the set's Texture. */
	set: string
	/** A base from the set's `bases`. */
	base: string
	/** UUID of one of the set's permutations. */
	permutation: string
}

/** A `paletted_permutations` atlas source, matching Minecraft's JSON. */
export interface IPalettedPermutationsSource {
	type: 'paletted_permutations'
	textures: string[]
	separator?: string
	palette_key: string
	permutations: Record<string, string>
}
