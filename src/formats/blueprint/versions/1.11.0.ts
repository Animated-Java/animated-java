import type { IBlueprintFormatJSON } from '..'
import { makeUniqueName } from '../../../util/uniqueName'

/**
 * Whether the model still uses Variant texture maps, or this branch's earlier `texture_slots`.
 */
export function needsTextureSlotUpgrade(model: any): boolean {
	return (
		model?.texture_slots !== undefined ||
		[model?.variants?.default, ...(model?.variants?.list ?? [])].some(
			variant => variant?.texture_map !== undefined
		)
	)
}

interface SlotTextureJSON {
	uuid: string
	name: string
	is_texture_slot: true
	slot_textures: string[]
	internal: true
}

/**
 * Replaces Variant texture maps with Texture Slots. Each texture a Variant swapped out becomes a
 * slot holding it and every texture it was swapped to, and every face using it now uses the slot.
 * Each Variant sets every slot, so applying one still resets textures it didn't change.
 */
export default function upgrade(model: any): IBlueprintFormatJSON {
	console.log('Processing model format 1.11.0', JSON.parse(JSON.stringify(model)))
	const fixed: any = JSON.parse(JSON.stringify(model))

	fixed.textures ??= []
	const textures: any[] = fixed.textures
	const cubeFaces: any[] = (fixed.elements ?? [])
		.filter((element: any) => element.type === 'cube' && element.faces)
		.flatMap((element: any) => Object.values(element.faces))
	const addSlot = (name: string, slotTextures: string[]): SlotTextureJSON => {
		const slot: SlotTextureJSON = {
			uuid: crypto.randomUUID(),
			name: makeUniqueName(name, n => textures.some(t => t.name === n)),
			is_texture_slot: true,
			slot_textures: slotTextures,
			internal: true,
		}
		textures.push(slot)
		return slot
	}

	// Slots saved by earlier 1.11.0 dev builds, before slots became textures.
	for (const old of fixed.texture_slots ?? []) {
		textures.push({
			uuid: old.uuid,
			name: makeUniqueName(old.name, n => textures.some(t => t.name === n)),
			is_texture_slot: true,
			slot_textures: old.textures ?? [],
			internal: true,
		})
		for (const face of cubeFaces) {
			if (face.texture_slot === old.uuid) face.texture = old.uuid
		}
	}
	delete fixed.texture_slots
	for (const face of cubeFaces) delete face.texture_slot

	const variants: any[] = [fixed.variants?.default, ...(fixed.variants?.list ?? [])].filter(
		Boolean
	)
	const slotByTexture = new Map<string, SlotTextureJSON>()
	for (const variant of variants) {
		for (const [from, to] of Object.entries<string>(variant.texture_map ?? {})) {
			const fromTexture = textures.find(t => t.uuid === from && !t.is_texture_slot)
			if (!fromTexture) continue
			let slot = slotByTexture.get(from)
			if (!slot) {
				slot = addSlot(
					String(fromTexture.name ?? 'slot').replace(/\.png$/i, '') + '_slot',
					[from]
				)
				slotByTexture.set(from, slot)
			}
			if (!slot.slot_textures.includes(to) && textures.some(t => t.uuid === to)) {
				slot.slot_textures.push(to)
			}
		}
	}

	for (const face of cubeFaces) {
		const uuid = typeof face.texture === 'number' ? textures[face.texture]?.uuid : face.texture
		const slot = uuid && slotByTexture.get(uuid)
		if (slot) face.texture = slot.uuid
	}

	for (const variant of variants) {
		const textureMap: Record<string, string> = variant.texture_map ?? {}
		delete variant.texture_map
		if (variant.is_default) continue
		variant.slot_textures ??= {}
		for (const [from, slot] of slotByTexture) {
			const to = textureMap[from]
			variant.slot_textures[slot.uuid] = to && slot.slot_textures.includes(to) ? to : from
		}
	}

	return fixed
}
