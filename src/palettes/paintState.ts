import { observable } from 'svelte-observable-store'
import { getStripColors } from './preview'
import type { PaletteColors } from './recolor'
import {
	getGeneratedSource,
	getGeneratedTextures,
	getPaletteSet,
	getPaletteSets,
	isGeneratedTexture,
	type PaletteSet,
} from './sets'
import type { IPaletteSetData, IPaletteStrip } from './types'

export interface IPaintContext {
	set: PaletteSet
	/** The permutation of the recolor being painted. Unset when painting a base. */
	permutation?: string
}

/** The Permutation Set texture being painted. The Color panel's swatch strip follows it. */
export const PAINT_CONTEXT = observable<IPaintContext | undefined>(undefined)

/** Set UUID -> the permutation all of that set's recolors show while painting. Never saved. */
export const COLORWAY_PREVIEW = observable<Record<string, string>>({})

/** The project set `texture` is a base of, if any. */
export function getSetOfBase(texture: Texture): PaletteSet | undefined {
	return getPaletteSets().find(
		set => !set.palette_set.reference && set.palette_set.bases.includes(texture.uuid)
	)
}

function getContextOf(texture: Texture | undefined | null): IPaintContext | undefined {
	if (!texture) return undefined
	const source = getGeneratedSource(texture)
	if (source) return { set: source.set, permutation: source.permutation.uuid }
	const set = getSetOfBase(texture)
	return set ? { set } : undefined
}

/** Points the paint context at `texture`, or clears it if `texture` isn't part of a set. */
export function followTexture(texture: Texture | undefined | null) {
	const next = getContextOf(texture)
	const current = PAINT_CONTEXT.get()
	if (current?.set === next?.set && current?.permutation === next?.permutation) return
	PAINT_CONTEXT.set(next)
	if (next) primeSetColors(next.set)
}

/** Re-sends the paint context, so anything showing its set's data picks up edits to it. */
export function refreshPaintContext() {
	const current = PAINT_CONTEXT.get()
	if (!current) return
	const set = getPaletteSet(current.set.uuid)
	PAINT_CONTEXT.set(set ? { ...current, set } : undefined)
	if (set) primeSetColors(set)
}

/** The permutation the swatch strip shows: a previewed colorway, else the painted recolor's. */
export function getStripPermutation(context = PAINT_CONTEXT.get()): string | undefined {
	if (!context) return undefined
	return COLORWAY_PREVIEW.get()[context.set.uuid] ?? context.permutation
}

/** Shows `permutation` on every recolor of `set` while painting, or undoes that if unset. */
export function previewColorway(set: PaletteSet, permutation: string | undefined) {
	const next = { ...COLORWAY_PREVIEW.get() }
	if (permutation) next[set.uuid] = permutation
	else delete next[set.uuid]
	COLORWAY_PREVIEW.set(next)
	Canvas.updateAllFaces()
}

export function clearColorwayPreviews() {
	if (!Object.keys(COLORWAY_PREVIEW.get()).length) return
	COLORWAY_PREVIEW.set({})
	if (Project) Canvas.updateAllFaces()
}

/** The texture shown in place of a recolor: the same base's recolor in the previewed colorway. */
export function getShownTexture(texture: Texture): Texture {
	if (!isGeneratedTexture(texture)) return texture
	const { set: setUuid, base, permutation } = texture.palette_generated
	const previewed = COLORWAY_PREVIEW.get()[setUuid]
	if (!previewed || previewed === permutation) return texture
	const set = getPaletteSet(setUuid)
	if (!set) return texture
	return (
		getGeneratedTextures(set).find(
			t => t.palette_generated.base === base && t.palette_generated.permutation === previewed
		) ?? texture
	)
}

/** Strip -> its colors, for pack strips whose image has been read. Edited strips are new objects. */
const RESOLVED_STRIPS = new WeakMap<IPaletteStrip, PaletteColors>()

/**
 * A strip's colors, right away. Pack strips return undefined until their image has been read,
 * which this starts.
 */
export function getStripColorsNow(
	data: IPaletteSetData,
	strip: IPaletteStrip
): PaletteColors | undefined {
	if (strip.colors) return strip.colors
	const resolved = RESOLVED_STRIPS.get(strip)
	if (!resolved) {
		void getStripColors(data, strip).then(colors => {
			if (colors) RESOLVED_STRIPS.set(strip, colors)
		})
	}
	return resolved
}

/** Starts reading a set's pack strips, so painting can use them without waiting. */
function primeSetColors(set: PaletteSet) {
	const data = set.palette_set
	getStripColorsNow(data, data.key)
	for (const permutation of data.permutations) getStripColorsNow(data, permutation.strip)
}
