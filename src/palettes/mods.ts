import {
	registerDeletableHandlerPatch,
	registerPatch,
	registerProjectPatch,
	registerPropertyOverridePatch,
} from 'blockbench-patch-manager'
import { openPaletteSetDialog } from './dialogs/paletteSet/paletteSet'
import { openReferencePickerDialog } from './dialogs/referencePicker/referencePicker'
import { isEnabled, isEnabledFor, translate } from './host'
import { decorateSetGroups } from './panel'
import { clearPalettePreviewCache, regenerateAllSets } from './preview'
import {
	affectsPaletteSets,
	arrangeGeneratedTextures,
	createPaletteSet,
	createSetData,
	getGeneratedSource,
	getPaintTarget,
	getPaletteSet,
	getProtectedRecolors,
	isGeneratedTexture,
	isPaletteSet,
	isPaletteTexture,
	removeTextures,
	repairSetGroups,
	type PaletteSet,
} from './sets'

registerPatch({
	id: 'animated_java:palettes/properties',

	apply: () => {
		const properties = [
			new Property(TextureGroup, 'object', 'palette_set'),
			new Property(Texture, 'object', 'palette_generated'),
		]
		return { properties }
	},

	revert: ({ properties }) => {
		for (const property of properties) property.delete()
	},
})

export const CREATE_PALETTE_SET_ACTION = registerDeletableHandlerPatch({
	id: 'animated_java:action/create-palette-set',
	create() {
		return new Blockbench.Action('animated_java:action/create-palette-set', {
			name: translate('action.create.name'),
			description: translate('action.create.description'),
			icon: 'palette',
			category: 'textures',
			condition: () => isEnabled(),
			click() {
				const bases = Texture.all.filter(
					t =>
						(t.selected || t.multi_selected) &&
						!isPaletteTexture(t) &&
						!t.is_texture_slot
				)
				const set = createPaletteSet(
					'permutation_set',
					createSetData({ bases: bases.map(t => t.uuid) })
				)
				openPaletteSetDialog(set)
			},
		})
	},
})

export const REFERENCE_PALETTE_SET_ACTION = registerDeletableHandlerPatch({
	id: 'animated_java:action/reference-palette-set',
	create() {
		return new Blockbench.Action('animated_java:action/reference-palette-set', {
			name: translate('action.reference.name'),
			description: translate('action.reference.description'),
			icon: 'colorize',
			category: 'textures',
			condition: () => isEnabled(),
			click: () => openReferencePickerDialog(),
		})
	},
})

registerPatch({
	id: 'animated_java:palettes/toolbar',
	dependencies: [
		'animated_java:action/create-palette-set',
		'animated_java:action/reference-palette-set',
	],

	apply: () => {
		const actions = [CREATE_PALETTE_SET_ACTION.get()!, REFERENCE_PALETTE_SET_ACTION.get()!]
		const toolbar = (Toolbars as Record<string, Toolbar>).texturelist
		for (const action of actions) toolbar.add(action, 4)
		return { actions, toolbar }
	},

	revert: ({ actions, toolbar }) => {
		for (const action of actions) toolbar.remove(action)
	},
})

/** Blockbench's texture menu entries that still make sense for a generated texture. */
const APPLY_ITEM_NAMES = ['menu.texture.face', 'menu.texture.blank', 'menu.texture.elements']

function openSetOf(texture: Texture) {
	const set = isGeneratedTexture(texture)
		? getPaletteSet(texture.palette_generated.set)
		: undefined
	if (set) openPaletteSetDialog(set)
}

// Generated textures get their own context menu. Their images are drawn from their set, so most
// texture actions (resizing, filters, saving, duplicating, deleting) don't apply.
registerPropertyOverridePatch({
	id: 'animated_java:palettes/context-menu',
	target: Texture.prototype as Texture & { showContextMenu(event: MouseEvent): unknown },
	key: 'showContextMenu',
	condition: () => isEnabled(),
	get: original => {
		const applyItems = Texture.prototype.menu!.structure.filter(
			(item: any) => typeof item === 'object' && APPLY_ITEM_NAMES.includes(item.name)
		)
		const generatedMenu = new Menu([
			new MenuSeparator('apply'),
			...applyItems,
			new MenuSeparator('palette'),
			{
				name: translate('menu.edit_set'),
				icon: 'tune',
				click: (texture: Texture) => openSetOf(texture),
			},
			{
				name: translate('menu.select_base'),
				icon: 'image',
				condition: (texture: Texture) => !!getGeneratedSource(texture)?.baseTexture,
				click: (texture: Texture) => getGeneratedSource(texture)?.baseTexture?.select(),
			},
		])

		return function (this: Texture, event: MouseEvent) {
			if (!isPaletteTexture(this)) return original.call(this, event)
			if (this !== Texture.selected) this.select()
			Prop.active_panel = 'textures'
			generatedMenu.open(event, this)
		}
	},
})

// Double-clicking a generated texture opens its set instead of the texture properties.
registerPropertyOverridePatch({
	id: 'animated_java:palettes/properties-dialog',
	target: Texture.prototype as Texture & { propertiesDialog(...args: any[]): unknown },
	key: 'propertiesDialog',
	condition: () => isEnabled(),
	get: original => {
		return function (this: Texture, ...args: any[]) {
			if (isPaletteTexture(this)) return openSetOf(this)
			return original.apply(this, args)
		}
	},
})

// A set's group header gets the set's own menu, in place of Blockbench's group menu (whose
// "Resolve" would orphan the recolors).
registerPropertyOverridePatch({
	id: 'animated_java:palettes/set-context-menu',
	target: TextureGroup.prototype as TextureGroup & {
		showContextMenu(event: MouseEvent): unknown
	},
	key: 'showContextMenu',
	condition: () => isEnabled(),
	get: original => {
		const setMenu = new Menu([
			{
				name: translate('menu.edit_set'),
				icon: 'tune',
				click: (set: PaletteSet) => openPaletteSetDialog(set),
			},
			{
				name: 'generic.rename',
				icon: 'text_format',
				click: (set: PaletteSet) => set.rename(),
			},
			new MenuSeparator('manage'),
			{
				name: translate('menu.delete_set'),
				icon: 'delete',
				click: (set: PaletteSet) => deleteSet(set),
			},
		])
		return function (this: TextureGroup, event: MouseEvent) {
			if (!isPaletteSet(this)) return original.call(this, event)
			Prop.active_panel = 'textures'
			setMenu.open(event, this)
		}
	},
})

// Double-clicking a set's group header opens the set.
registerPropertyOverridePatch({
	id: 'animated_java:palettes/set-double-click',
	target: TextureGroup.prototype as TextureGroup & { select(): TextureGroup },
	key: 'select',
	condition: () => isEnabled(),
	get: original => {
		return function (this: TextureGroup) {
			if (!isPaletteSet(this)) return original.call(this)
			openPaletteSetDialog(this)
			return this
		}
	},
})

function deleteSet(set: PaletteSet) {
	removeTextures([], [set])
	TextureAnimator.updateButton()
	UVEditor.vue.updateTexture()
	BARS.updateConditions()
}

registerPropertyOverridePatch({
	id: 'animated_java:palettes/painter-target',
	target: Painter as typeof Painter & { getTextureToEdit(texture: Texture): Texture },
	key: 'getTextureToEdit',
	condition: () => isEnabled(),
	get: original => {
		return function (this: typeof Painter, texture: Texture) {
			return original.call(this, getPaintTarget(texture))
		}
	},
})

/**
 * Whether a paint stroke on `texture` must be stopped: a reference set's recolors are redrawn from
 * the pack, so paint on them would be lost. Picking colors from them is fine.
 */
function blocksPainting(texture: Texture | undefined | null | false): boolean {
	if (!isGeneratedTexture(texture) || Toolbox.selected?.id === 'color_picker') return false
	if (getPaintTarget(texture) !== texture) return false
	Blockbench.showQuickMessage(translate('paint_reference'), 3000)
	return true
}

registerPropertyOverridePatch({
	id: 'animated_java:palettes/block-reference-paint-canvas',
	target: Painter as typeof Painter & { startPaintToolCanvas(data: any, event: Event): unknown },
	key: 'startPaintToolCanvas',
	condition: () => isEnabled(),
	get: original => {
		return function (this: typeof Painter, data: any, event: Event) {
			const face = data?.element?.faces?.[data.face] as CubeFace | undefined
			if (blocksPainting(face?.getTexture())) return
			return original.call(this, data, event)
		}
	},
})

registerPropertyOverridePatch({
	id: 'animated_java:palettes/block-reference-paint-uv',
	target: UVEditor as typeof UVEditor & { startPaintTool(event: Event): unknown },
	key: 'startPaintTool',
	condition: () => isEnabled(),
	get: original => {
		return function (this: typeof UVEditor, event: Event) {
			if (blocksPainting(UVEditor.getTexture() as Texture | undefined)) return
			return original.call(this, event)
		}
	},
})

// The UV editor paints the texture it shows, so show a project recolor's base, which is what
// painting the recolor edits.
registerPatch({
	id: 'animated_java:palettes/uv-editor-base',

	apply: () => {
		const vue = UVEditor.vue as unknown as { texture: Texture | null; updateTexture(): void }
		const original = vue.updateTexture
		vue.updateTexture = function (this: typeof vue) {
			original.call(this)
			if (!isEnabled() || !this.texture) return
			const target = getPaintTarget(this.texture)
			if (target !== this.texture) this.texture = target
		}
		return { vue, original }
	},

	revert: ({ vue, original }) => {
		vue.updateTexture = original
	},
})

// Removing a set, generated texture or base also removes what depends on it, in one undo step.
registerPatch({
	id: 'animated_java:palettes/delete',

	apply: () => {
		const selected = () => Texture.all.filter(t => t.selected || t.multi_selected)
		const handler = SharedActions.add('delete', {
			subject: 'texture',
			priority: 1,
			condition: () =>
				isEnabled() &&
				Prop.active_panel === 'textures' &&
				// Texture Slots have their own delete handler, which plans removals the same way.
				!selected().some(t => t.is_texture_slot) &&
				affectsPaletteSets(selected()),
			run() {
				if (getProtectedRecolors(selected()).length) {
					Blockbench.showQuickMessage(translate('delete_recolor'), 4000)
					return
				}
				removeTextures(selected())
				TextureAnimator.updateButton()
				UVEditor.vue.updateTexture()
				BARS.updateConditions()
			},
		})
		return { handler }
	},

	revert: ({ handler }) => {
		handler.delete()
	},
})

// Keeps generated textures in step with their bases and strips.
registerProjectPatch({
	id: 'animated_java:palettes/regenerate',

	condition: ({ project }) => isEnabledFor(project),
	// Each project has its own sets, so redraw them on every switch.
	alwaysRevertOnProjectChange: true,

	apply() {
		const refresh = () =>
			requestAnimationFrame(() => {
				decorateSetGroups()
				void regenerateAllSets()
			})
		const onUndoRedo = () => {
			repairSetGroups()
			arrangeGeneratedTextures()
			refresh()
		}
		const onFinishEdit = ({ aspects }: { aspects?: UndoAspects }) => {
			// Dragging or importing textures can move them into or out of a set's group.
			if (aspects?.textures && repairSetGroups()) {
				Blockbench.showQuickMessage(translate('group_managed'), 4000)
			}
			if (aspects?.textures || aspects?.bitmap || aspects?.texture_groups) refresh()
		}
		const events: Array<keyof BlockbenchEventMap> = ['add_texture', 'change_texture_path']
		for (const event of events) Blockbench.on(event, refresh)
		Blockbench.on('undo', onUndoRedo)
		Blockbench.on('redo', onUndoRedo)
		Blockbench.on('finish_edit', onFinishEdit)
		repairSetGroups()
		refresh()
		return { events, refresh, onUndoRedo, onFinishEdit }
	},

	revert({ events, refresh, onUndoRedo, onFinishEdit }) {
		for (const event of events) Blockbench.removeListener(event, refresh)
		Blockbench.removeListener('undo', onUndoRedo)
		Blockbench.removeListener('redo', onUndoRedo)
		Blockbench.removeListener('finish_edit', onFinishEdit)
		clearPalettePreviewCache()
	},
})
