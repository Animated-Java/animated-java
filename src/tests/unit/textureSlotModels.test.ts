import { describe, expect, it } from '@jest/globals'
import {
	createTextureSlotItemDefinition,
	splitModelByTextureSlot,
} from '../../systems/resourcepackCompiler/textureSlotModels'

const TINTS: any[] = [{ type: 'minecraft:dye', default: [1, 1, 1] }]

function makeModel(): any {
	return {
		credit: 'credit',
		textures: {
			particle: 'minecraft:item/pufferfish',
			'0': 'aj:skin',
			slot_shirt: 'aj:red',
			slot_hat: 'aj:green',
		},
		display: { head: { rotation: [0, 180, 0] } },
		elements: [
			{
				from: [0, 0, 0],
				to: [1, 1, 1],
				faces: {
					north: { uv: [0, 0, 1, 1], texture: '#slot_shirt' },
					south: { uv: [0, 0, 1, 1], texture: '#0' },
					up: { uv: [0, 0, 1, 1], texture: '#slot_hat' },
				},
			},
			{
				from: [1, 1, 1],
				to: [2, 2, 2],
				faces: { east: { uv: [0, 0, 1, 1], texture: '#slot_shirt' } },
			},
		],
	}
}

describe('splitModelByTextureSlot', () => {
	it('splits faces into a base model and one model per slot', () => {
		const { base, slots } = splitModelByTextureSlot(
			makeModel(),
			new Set(['slot_shirt', 'slot_hat'])
		)

		expect(base?.textures).toEqual({ particle: 'minecraft:item/pufferfish', '0': 'aj:skin' })
		expect(base?.elements?.map(e => Object.keys(e.faces ?? {}))).toEqual([['south']])

		expect(slots.slot_shirt.textures).toEqual({
			particle: 'minecraft:item/pufferfish',
			slot_shirt: 'aj:red',
		})
		expect(slots.slot_shirt.elements?.map(e => Object.keys(e.faces ?? {}))).toEqual([
			['north'],
			['east'],
		])
		expect(slots.slot_hat.elements?.map(e => Object.keys(e.faces ?? {}))).toEqual([['up']])
		expect(slots.slot_hat.display).toEqual({ head: { rotation: [0, 180, 0] } })
	})

	it('leaves out the base model when every face is in a slot', () => {
		const model = makeModel()
		model.elements = [model.elements[1]]
		const { base, slots } = splitModelByTextureSlot(model, new Set(['slot_shirt']))
		expect(base).toBeUndefined()
		expect(Object.keys(slots)).toEqual(['slot_shirt'])
	})
})

describe('createTextureSlotItemDefinition', () => {
	it('composes the base model with a custom_model_data select per slot', () => {
		const definition = createTextureSlotItemDefinition({
			baseModel: 'aj:bone',
			slots: [
				{
					index: 1,
					defaultModel: 'aj:bone/shirt',
					textureModels: { blue: 'aj:bone/shirt/blue' },
				},
			],
			tints: TINTS,
		})

		expect(definition).toEqual({
			model: {
				type: 'minecraft:composite',
				models: [
					{ type: 'minecraft:model', model: 'aj:bone', tints: TINTS },
					{
						type: 'minecraft:select',
						property: 'minecraft:custom_model_data',
						index: 1,
						cases: [
							{
								when: 'blue',
								model: {
									type: 'minecraft:model',
									model: 'aj:bone/shirt/blue',
									tints: TINTS,
								},
							},
						],
						fallback: { type: 'minecraft:model', model: 'aj:bone/shirt', tints: TINTS },
					},
				],
			},
		})
	})

	it('skips the composite and select when there is only one part with one texture', () => {
		const definition = createTextureSlotItemDefinition({
			baseModel: undefined,
			slots: [{ index: 0, defaultModel: 'aj:bone/hat', textureModels: {} }],
			tints: TINTS,
		})
		expect(definition).toEqual({
			model: { type: 'minecraft:model', model: 'aj:bone/hat', tints: TINTS },
		})
	})
})
