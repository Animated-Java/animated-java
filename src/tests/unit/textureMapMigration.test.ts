import { describe, expect, it } from '@jest/globals'
import upgrade, { needsTextureSlotUpgrade } from '../../formats/blueprint/versions/1.11.0'

function makeModel(): any {
	return {
		meta: { format_version: '1.10.2' },
		textures: [
			{ uuid: 'red', name: 'red.png' },
			{ uuid: 'blue', name: 'blue.png' },
			{ uuid: 'green', name: 'green.png' },
			{ uuid: 'skin', name: 'skin.png' },
		],
		elements: [
			{
				type: 'cube',
				faces: {
					north: { texture: 'red' },
					south: { texture: 0 },
					east: { texture: 'skin' },
					west: { texture: null },
				},
			},
			{ type: 'locator' },
		],
		variants: {
			default: { uuid: 'default', is_default: true, texture_map: {} },
			list: [
				{ uuid: 'a', texture_map: { red: 'blue' } },
				{ uuid: 'b', texture_map: { red: 'green', skin: 'missing' } },
				{ uuid: 'c', texture_map: {} },
			],
		},
	}
}

const slotsOf = (model: any) => model.textures.filter((t: any) => t.is_texture_slot)

describe('1.11.0 Texture Slot migration', () => {
	it('detects texture maps and older slot data', () => {
		expect(needsTextureSlotUpgrade(makeModel())).toBe(true)
		expect(needsTextureSlotUpgrade({ texture_slots: [] })).toBe(true)
		expect(needsTextureSlotUpgrade(upgrade(makeModel()))).toBe(false)
		expect(needsTextureSlotUpgrade({})).toBe(false)
	})

	it('turns each swapped texture into a slot texture referencing every texture it swapped to', () => {
		const slots = slotsOf(upgrade(makeModel()))
		expect(slots).toEqual([
			{
				uuid: expect.any(String),
				name: 'red_slot',
				is_texture_slot: true,
				slot_textures: ['red', 'blue', 'green'],
				internal: true,
			},
			{
				uuid: expect.any(String),
				name: 'skin_slot',
				is_texture_slot: true,
				slot_textures: ['skin'],
				internal: true,
			},
		])
	})

	it('points faces that used a swapped texture at its slot, including by texture index', () => {
		const result = upgrade(makeModel()) as any
		const [red, skin] = slotsOf(result)
		const faces = result.elements[0].faces
		expect(faces.north.texture).toBe(red.uuid)
		expect(faces.south.texture).toBe(red.uuid)
		expect(faces.east.texture).toBe(skin.uuid)
		expect(faces.west.texture).toBeNull()
	})

	it('has every Variant set every slot, falling back to the default', () => {
		const result = upgrade(makeModel()) as any
		const [red, skin] = slotsOf(result)
		const [a, b, c] = result.variants.list
		expect(a.slot_textures).toEqual({ [red.uuid]: 'blue', [skin.uuid]: 'skin' })
		expect(b.slot_textures).toEqual({ [red.uuid]: 'green', [skin.uuid]: 'skin' })
		expect(c.slot_textures).toEqual({ [red.uuid]: 'red', [skin.uuid]: 'skin' })
		expect(result.variants.default.slot_textures).toBeUndefined()
		expect(a.texture_map).toBeUndefined()
	})

	it('converts slots saved by earlier 1.11.0 dev builds', () => {
		const model = {
			textures: [{ uuid: 'red', name: 'red.png' }],
			texture_slots: [
				{ uuid: 'shirt', name: 'shirt', display_name: 'Shirt', textures: ['red'] },
			],
			elements: [
				{
					type: 'cube',
					faces: {
						north: { texture: 'red', texture_slot: 'shirt' },
						south: { texture: 'red' },
					},
				},
			],
		}
		const result = upgrade(model) as any
		expect(result.texture_slots).toBeUndefined()
		expect(slotsOf(result)).toEqual([
			{
				uuid: 'shirt',
				name: 'shirt',
				is_texture_slot: true,
				slot_textures: ['red'],
				internal: true,
			},
		])
		expect(result.elements[0].faces).toEqual({
			north: { texture: 'shirt' },
			south: { texture: 'red' },
		})
	})

	it('keeps slot names unique among textures and leaves the input untouched', () => {
		const model = makeModel()
		model.textures.push({ uuid: 'x', name: 'red_slot' })
		const result = upgrade(model) as any
		expect(slotsOf(result).map((s: any) => s.name)).toEqual(['red_slot1', 'skin_slot'])
		expect(model.variants.list[0].texture_map).toEqual({ red: 'blue' })
	})
})
