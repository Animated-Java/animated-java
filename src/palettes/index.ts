/**
 * Paletted permutations: Permutation Sets that recolor base textures with palettes, the way
 * Minecraft's `paletted_permutations` atlas source does, and generate a texture per recolor.
 *
 * This module has no Animated Java imports outside `host.ts`. Hosts use it only through the API
 * exported here.
 */
import './mods'

export { buildAtlasSource, getPaletteId, getSpriteId, supportsSeparator } from './atlas'
export { checkPaletteSet, type IPaletteIssue } from './checks'
export { findPaletteExportErrors } from './exportChecks'
export {
	clearPalettePreviewCache,
	encodeColorsAsPng,
	getBasePixels,
	getStripColors,
	pixelsToDataURL,
	regenerateAllSets,
	savePackImages,
} from './preview'
export {
	applyTextureRemoval,
	createPaletteSet,
	createSetData,
	editPaletteSet,
	getBaseLabel,
	getBaseTextures,
	getCubesUsing,
	getGeneratedSource,
	getGeneratedTextures,
	getPaintTarget,
	getPaletteSet,
	getProtectedRecolors,
	getRemovalUndoAspects,
	getPaletteSets,
	isGeneratedTexture,
	isPaletteSet,
	isPaletteTexture,
	isReferenceSet,
	planTextureRemoval,
	removeTextures,
	repairSetGroups,
	type GeneratedTexture,
	type IGeneratedSource,
	type ITextureRemoval,
	type PaletteSet,
} from './sets'
export type * from './types'
