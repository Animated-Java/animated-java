import { TextDisplay } from '../../outliner/textDisplay'
import { VanillaBlockDisplay } from '../../outliner/vanillaBlockDisplay'
import { VanillaItemDisplay } from '../../outliner/vanillaItemDisplay'
import EVENTS from '../../util/events'
import { getPreviewResourcePackKey, setPreviewResourcePacks } from './assetManager'
import { clearBlockModelCache } from './blockModelManager'
import { clearPreparedAssetsCache } from './bmrModelRenderer'
import { clearFontCache } from './fontManager'
import { clearGlyphGeometryCache } from './fontRenderer'
import { clearItemModelCache } from './itemModelManager'

/** The preview resource pack paths configured on the current project, highest priority first. */
function getConfiguredPreviewResourcePacks(): string[] {
	return Project?.animated_java?.preview_resource_packs ?? []
}

function invalidateCaches() {
	clearPreparedAssetsCache()
	clearItemModelCache()
	clearBlockModelCache()
	clearFontCache()
	clearGlyphGeometryCache()
}

function refreshDisplays() {
	VanillaItemDisplay.forceUpdateAll()
	VanillaBlockDisplay.forceUpdateAll()
	TextDisplay.forceUpdateAll()
	Canvas.updateAll()
}

/**
 * Loads the preview resource packs configured on the current project (or clears
 * any previously loaded overlay), then rebuilds every affected preview so custom
 * fonts, models, and textures show up in the editor.
 */
export async function applyPreviewResourcePack() {
	const paths = getConfiguredPreviewResourcePacks()
	const previousKey = getPreviewResourcePackKey()

	try {
		await setPreviewResourcePacks(paths)
	} catch (error) {
		console.error('Failed to load preview resource packs:', error)
		Blockbench.showQuickMessage(
			'Failed to load preview resource packs. See console for details.'
		)
		await setPreviewResourcePacks([])
	}

	// Nothing changed, so there's no need to churn every cache and preview.
	if (getPreviewResourcePackKey() === previousKey) return

	invalidateCaches()
	refreshDisplays()
}

EVENTS.SELECT_AJ_PROJECT.subscribe(() => {
	requestAnimationFrame(() => {
		if (!Project?.animated_java) return
		void applyPreviewResourcePack()
	})
})

// Free the overlay's memory when its project closes; the next AJ project select
// reloads whatever that project configured.
EVENTS.CLOSE_PROJECT.subscribe(() => {
	if (!getPreviewResourcePackKey()) return
	void setPreviewResourcePacks([]).then(() => {
		invalidateCaches()
	})
})

/**
 * Force-reloads the current project's preview resource packs from disk, rebuilding
 * every preview even if the paths are unchanged (their contents may have been
 * edited on disk).
 */
export async function reloadPreviewResourcePack() {
	const paths = getConfiguredPreviewResourcePacks()

	try {
		await setPreviewResourcePacks([])
		await setPreviewResourcePacks(paths)
	} catch (error) {
		console.error('Failed to reload preview resource packs:', error)
		Blockbench.showQuickMessage(
			'Failed to load preview resource packs. See console for details.'
		)
		await setPreviewResourcePacks([])
	}

	invalidateCaches()
	refreshDisplays()
}
