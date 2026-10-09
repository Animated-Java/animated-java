declare global {
	// @ts-expect-error - Broken BB types
	interface Texture {
		/** Whether this texture is a Texture Slot, standing in for one of {@link slot_textures}. */
		is_texture_slot: boolean
		/** A Texture Slot's texture UUIDs, in order. The first one is the default. */
		slot_textures: string[]
	}
}

/** First Minecraft version whose item model definitions can swap each slot independently. */
export const TEXTURE_SLOT_COMMANDS_MIN_VERSION = '1.21.4'

/** Slot -> texture UUID shown in the editor instead of the default. Not saved. */
const PREVIEWS = new WeakMap<Texture, string>()

let resolveSlots = true

export function isTextureSlot(
	texture: Texture | undefined | null | false
): texture is Texture & { is_texture_slot: true } {
	return !!texture && !!texture.is_texture_slot
}

export function getTextureSlots(): Texture[] {
	return Texture.all.filter(isTextureSlot)
}

export function getTextureSlot(uuid: string): Texture | undefined {
	const texture = Texture.all.find(t => t.uuid === uuid)
	return isTextureSlot(texture) ? texture : undefined
}

/**
 * The slot's textures that still exist, in order.
 */
export function getSlotTextures(slot: Texture): Texture[] {
	return slot.slot_textures
		.map(uuid => Texture.all.find(t => t.uuid === uuid))
		.filter((t): t is Texture => !!t && !isTextureSlot(t))
}

export function getSlotDefaultTexture(slot: Texture): Texture | undefined {
	return getSlotTextures(slot)[0]
}

export function getSlotPreviewTexture(slot: Texture): Texture | undefined {
	const textures = getSlotTextures(slot)
	const previewed = PREVIEWS.get(slot)
	return textures.find(t => t.uuid === previewed) ?? textures[0]
}

export function getSlotFaces(slot: Texture): CubeFace[] {
	return Cube.all.flatMap(cube =>
		Object.values(cube.faces).filter(face => face.texture === slot.uuid)
	)
}

/**
 * Whether faces resolve a slot to the texture it shows. Off while saving, so faces keep the slot.
 */
export function shouldResolveSlots() {
	return resolveSlots
}

export function setSlotResolution(enabled: boolean) {
	resolveSlots = enabled
}

/**
 * Makes the slot's own image a copy of the texture it shows, for its icon in the Textures panel.
 */
export function updateSlotImage(slot: Texture) {
	slot.internal = true
	slot.saved = true
	const texture = getSlotPreviewTexture(slot)
	if (!texture) return
	if (!texture.img.complete || !texture.img.naturalWidth) {
		texture.img.addEventListener('load', () => updateSlotImage(slot), { once: true })
		return
	}
	// Copy the pixels, not `source`: for file textures that's a path, which menus can't show.
	// Read them from the image, since the texture's canvas may not be drawn yet right after loading.
	const canvas = document.createElement('canvas')
	canvas.width = texture.img.naturalWidth
	canvas.height = texture.img.naturalHeight
	canvas.getContext('2d')!.drawImage(texture.img, 0, 0)
	const dataUrl = canvas.toDataURL()
	if (slot.source !== dataUrl) slot.updateSource(dataUrl)
}

export function updateAllSlotImages() {
	for (const slot of getTextureSlots()) updateSlotImage(slot)
}

/**
 * Picks the texture each slot shows in the editor. `choose` returns a texture UUID, or undefined
 * for the slot's default.
 */
export function previewSlots(choose: (slot: Texture) => string | undefined) {
	let changed = false
	for (const slot of getTextureSlots()) {
		const uuid = choose(slot)
		const preview =
			uuid && uuid !== slot.slot_textures[0] && slot.slot_textures.includes(uuid)
				? uuid
				: undefined
		if (PREVIEWS.get(slot) === preview) continue
		if (preview) PREVIEWS.set(slot, preview)
		else PREVIEWS.delete(slot)
		updateSlotImage(slot)
		changed = true
	}
	if (changed) Canvas.updateAllFaces()
}

export function previewSlotTexture(slot: Texture, uuid: string | undefined) {
	previewSlots(s => (s === slot ? uuid : PREVIEWS.get(s)))
}

/**
 * Snapshots every slot's preview, and returns a function that restores them.
 */
export function savePreviews(): () => void {
	const saved = new Map(getTextureSlots().map(slot => [slot, PREVIEWS.get(slot)]))
	return () => previewSlots(slot => saved.get(slot))
}

/**
 * Drops textures that were removed from the project. Not undoable, so only used right before
 * exporting.
 */
export function verifySlotTextures(slot: Texture) {
	const textures = getSlotTextures(slot).map(t => t.uuid)
	if (textures.length !== slot.slot_textures.length) slot.slot_textures = textures
}

/**
 * Creates a Texture Slot holding `textures`, as one undo step.
 */
export function createTextureSlot(textures: Texture[]): Texture {
	Undo.initEdit({ textures: [] })
	const slot = new Texture({ name: 'texture_slot' })
	slot.is_texture_slot = true
	slot.slot_textures = textures.filter(t => !isTextureSlot(t)).map(t => t.uuid)
	slot.add(false)
	updateSlotImage(slot)
	Undo.finishEdit('Create texture slot', { textures: [slot] })
	return slot
}
