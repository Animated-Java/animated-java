import {
	registerDeletableHandlerPatch,
	registerPatch,
	registerProjectPatch,
	registerPropertyOverridePatch,
} from 'blockbench-patch-manager'
import { openTextureSlotDialog } from '../dialogs/textureSlotConfig/textureSlotConfig'
import { activeProjectIsBlueprintFormat, BLUEPRINT_FORMAT_ID } from '../formats/blueprint'
import {
	createTextureSlot,
	getSlotDefaultTexture,
	getSlotPreviewTexture,
	getSlotTextures,
	isTextureSlot,
	previewSlotTexture,
	updateAllSlotImages,
} from '../textureSlots'
import { localize as translate } from '../util/lang'

registerPatch({
	id: 'animated_java:texture-slot-properties',

	apply: () => {
		const properties = [
			new Property(Texture, 'boolean', 'is_texture_slot'),
			new Property(Texture, 'array', 'slot_textures'),
		]
		return { properties }
	},

	revert: ({ properties }) => {
		for (const property of properties) property.delete()
	},
})

export const CREATE_TEXTURE_SLOT_ACTION = registerDeletableHandlerPatch({
	id: 'animated_java:action/create-texture-slot',
	create() {
		return new Blockbench.Action('animated_java:action/create-texture-slot', {
			name: translate('action.texture_slots.create'),
			icon: 'style',
			category: 'textures',
			condition: () => activeProjectIsBlueprintFormat(),
			click() {
				const selected = Texture.all.filter(t => t.selected || t.multi_selected)
				const slot = createTextureSlot(selected)
				slot.select()
				openTextureSlotDialog(slot)
			},
		})
	},
})

registerPatch({
	id: 'animated_java:texture-slot-toolbar',
	dependencies: ['animated_java:action/create-texture-slot'],

	apply: () => {
		const action = CREATE_TEXTURE_SLOT_ACTION.get()!
		const toolbar = (Toolbars as Record<string, Toolbar>).texturelist
		toolbar.add(action, 3)
		return { action, toolbar }
	},

	revert: ({ action, toolbar }) => {
		toolbar.remove(action)
	},
})

/** Blockbench's texture menu entries that still make sense for a slot: applying it to faces. */
const APPLY_ITEM_NAMES = ['menu.texture.face', 'menu.texture.blank', 'menu.texture.elements']

// Slots get their own context menu. Most texture actions (resizing, filters, saving, animation)
// would only affect the slot's mirrored preview image.
registerPropertyOverridePatch({
	id: 'animated_java:texture/slot-context-menu',
	target: Texture.prototype as Texture & { showContextMenu(event: MouseEvent): unknown },
	key: 'showContextMenu',
	condition: () => activeProjectIsBlueprintFormat(),
	get: original => {
		const checked = 'radio_button_checked'
		const unchecked = 'radio_button_unchecked'
		const applyItems = Texture.prototype.menu!.structure.filter(
			(item: any) => typeof item === 'object' && APPLY_ITEM_NAMES.includes(item.name)
		)
		const slotMenu = new Menu([
			new MenuSeparator('apply'),
			...applyItems,
			new MenuSeparator('texture_slot'),
			{
				name: translate('menu.texture_slot.preview'),
				icon: 'visibility',
				children: (slot: Texture) =>
					getSlotTextures(slot).map(texture => ({
						name: texture.name,
						icon: texture === getSlotPreviewTexture(slot) ? checked : unchecked,
						click: () => previewSlotTexture(slot, texture.uuid),
					})),
			},
			{
				name: translate('menu.texture_slot.properties'),
				icon: 'tune',
				click: (slot: Texture) => openTextureSlotDialog(slot),
			},
			new MenuSeparator('manage'),
			'duplicate',
			'delete',
		])

		return function (this: Texture, event: MouseEvent) {
			if (!isTextureSlot(this)) return original.call(this, event)
			if (this !== Texture.selected) this.select()
			Prop.active_panel = 'textures'
			slotMenu.open(event, this)
		}
	},
})

// Double-clicking a slot opens its own dialog instead of the texture properties.
registerPropertyOverridePatch({
	id: 'animated_java:texture/slot-properties-dialog',
	target: Texture.prototype as Texture & { propertiesDialog(...args: any[]): unknown },
	key: 'propertiesDialog',
	condition: () => activeProjectIsBlueprintFormat(),
	get: original => {
		return function (this: Texture, ...args: any[]) {
			if (isTextureSlot(this)) return openTextureSlotDialog(this)
			return original.apply(this, args)
		}
	},
})

// Painting a slot, from the Textures panel or the UV editor, paints the texture it shows.
registerPropertyOverridePatch({
	id: 'animated_java:painter/texture-slot-target',
	target: Painter as typeof Painter & { getTextureToEdit(texture: Texture): Texture },
	key: 'getTextureToEdit',
	condition: () => activeProjectIsBlueprintFormat(),
	get: original => {
		return function (this: typeof Painter, texture: Texture) {
			if (isTextureSlot(texture)) texture = getSlotPreviewTexture(texture) ?? texture
			return original.call(this, texture)
		}
	},
})

// Deleting a slot moves its faces to the slot's default texture, in the same undo step.
registerPatch({
	id: 'animated_java:texture-slot-delete',

	apply: () => {
		const handler = SharedActions.add('delete', {
			subject: 'texture',
			priority: 1,
			condition: () =>
				activeProjectIsBlueprintFormat() &&
				Prop.active_panel === 'textures' &&
				Texture.all.some(t => (t.selected || t.multi_selected) && isTextureSlot(t)),
			run() {
				const textures = Texture.all.filter(t => t.selected || t.multi_selected)
				const slots = textures.filter(isTextureSlot)
				const uuids = new Set(slots.map(slot => slot.uuid))
				const cubes = Cube.all.filter(cube =>
					Object.values(cube.faces).some(face => uuids.has(face.texture as string))
				)

				Undo.initEdit({ textures, elements: cubes, uv_only: true })
				for (const slot of slots) {
					const fallback = getSlotDefaultTexture(slot)?.uuid ?? false
					for (const cube of cubes) {
						for (const face of Object.values(cube.faces)) {
							if (face.texture === slot.uuid) face.texture = fallback
						}
					}
				}
				for (const texture of textures) texture.remove(true)
				Canvas.updateAllFaces()
				TextureAnimator.updateButton()
				UVEditor.vue.updateTexture()
				BARS.updateConditions()
				Undo.finishEdit('Remove texture', { textures: [], elements: cubes, uv_only: true })
			},
		})
		return { handler }
	},

	revert: ({ handler }) => {
		handler.delete()
	},
})

// Keeps each slot's icon in step with the texture it shows.
registerProjectPatch({
	id: 'animated_java:texture-slot-images',

	condition: ({ project }) => project.format.id === BLUEPRINT_FORMAT_ID,

	apply() {
		requestAnimationFrame(updateAllSlotImages)
		const refresh = () => requestAnimationFrame(updateAllSlotImages)
		const events: Array<keyof BlockbenchEventMap> = [
			'finish_edit',
			'undo',
			'redo',
			'add_texture',
			'change_texture_path',
		]
		for (const event of events) Blockbench.on(event, refresh)
		return { events, refresh }
	},

	revert({ events, refresh }) {
		for (const event of events) Blockbench.removeListener(event, refresh)
	},
})
