import type { IItemDefinition, TintSource } from '../minecraft/itemDefinitions'
import type { IRenderedElement, IRenderedModel } from '../rigRenderer'

type ItemModel = IItemDefinition['model']

export interface ISplitBoneModel {
	/** Faces outside any Texture Slot, or undefined if every face is in a slot. */
	base: IRenderedModel | undefined
	/** One model per slot, keyed by the slot's texture variable. */
	slots: Record<string, IRenderedModel>
}

/**
 * Splits a bone model so each Texture Slot's faces can be swapped on their own. A cube with faces
 * in several slots is copied into each of their models, keeping only that slot's faces.
 */
export function splitModelByTextureSlot(
	model: IRenderedModel,
	slotKeys: Set<string>
): ISplitBoneModel {
	const partElements = new Map<string, IRenderedElement[]>()

	for (const element of model.elements ?? []) {
		const partFaces = new Map<string, IRenderedElement['faces']>()
		for (const [direction, face] of Object.entries(element.faces ?? {})) {
			const key = face.texture.replace(/^#/, '')
			const part = slotKeys.has(key) ? key : ''
			let faces = partFaces.get(part)
			if (!faces) partFaces.set(part, (faces = {}))
			faces[direction] = face
		}
		for (const [part, faces] of partFaces) {
			let elements = partElements.get(part)
			if (!elements) partElements.set(part, (elements = []))
			elements.push({ ...element, faces })
		}
	}

	const { particle } = model.textures
	const withElements = (elements: IRenderedElement[], textures: Record<string, string>) => ({
		...model,
		textures: particle ? { particle, ...textures } : textures,
		elements,
	})

	const slots: Record<string, IRenderedModel> = {}
	let base: IRenderedModel | undefined
	for (const [part, elements] of partElements) {
		if (part) {
			slots[part] = withElements(elements, { [part]: model.textures[part] })
		} else {
			const textures = Object.fromEntries(
				Object.entries(model.textures).filter(([key]) => !slotKeys.has(key))
			)
			base = withElements(elements, textures)
		}
	}

	return { base, slots }
}

export interface ISlotItemModel {
	/** The slot's position in the bone item's `custom_model_data` strings. */
	index: number
	/** Model shown for the default texture, or any texture name that isn't listed. */
	defaultModel: string
	/** Texture name -> model, for every texture but the default. */
	textureModels: Record<string, string>
}

/**
 * Builds a bone's item definition: its unslotted model plus one `custom_model_data` select per
 * Texture Slot, all drawn together.
 */
export function createTextureSlotItemDefinition(options: {
	baseModel: string | undefined
	slots: ISlotItemModel[]
	tints: TintSource[]
}): IItemDefinition {
	const model = (resourceLocation: string): ItemModel => ({
		type: 'minecraft:model',
		model: resourceLocation,
		tints: options.tints,
	})

	const parts: ItemModel[] = []
	if (options.baseModel) parts.push(model(options.baseModel))
	for (const slot of options.slots) {
		if (!Object.keys(slot.textureModels).length) {
			parts.push(model(slot.defaultModel))
			continue
		}
		parts.push({
			type: 'minecraft:select',
			property: 'minecraft:custom_model_data',
			index: slot.index,
			cases: Object.entries(slot.textureModels).map(([when, resourceLocation]) => ({
				when,
				model: model(resourceLocation),
			})),
			fallback: model(slot.defaultModel),
		})
	}

	return {
		model: parts.length === 1 ? parts[0] : { type: 'minecraft:composite', models: parts },
	}
}
