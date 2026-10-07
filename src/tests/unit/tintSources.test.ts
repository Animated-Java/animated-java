import { beforeAll, describe, expect, it } from '@jest/globals'
import {
	changeTintSourceType,
	createDefaultTintSource,
	getAvailableTintSourceTypes,
	isTintSourceTypeAvailable,
	normalizeTintColor,
	normalizeTintSource,
	tintColorFromHex,
	tintColorToHex,
} from '../../systems/minecraft/tintSources'

beforeAll(() => {
	// Blockbench's `compareVersions(a, b)` returns whether `a > b`, comparing dot-separated numbers.
	;(globalThis as Record<string, unknown>).compareVersions = (a: string, b: string) => {
		const pa = a.split('.').map(Number)
		const pb = b.split('.').map(Number)
		for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
			const diff = (pa[i] ?? 0) - (pb[i] ?? 0)
			if (diff) return diff > 0
		}
		return false
	}
})

describe('getAvailableTintSourceTypes', () => {
	it('has no types before 1.21.4', () => {
		expect(getAvailableTintSourceTypes('1.21.2')).toEqual([])
	})

	it('has all 8 types from 1.21.4 through 26.2', () => {
		expect(getAvailableTintSourceTypes('1.21.4')).toHaveLength(8)
		expect(getAvailableTintSourceTypes('26.2')).toHaveLength(8)
	})

	it('drops map_color in 26.3', () => {
		const types = getAvailableTintSourceTypes('26.3')
		expect(types).toHaveLength(7)
		expect(types).not.toContain('minecraft:map_color')
		expect(isTintSourceTypeAvailable('minecraft:map_color', '26.2')).toBe(true)
	})

	it('rejects unknown types', () => {
		expect(isTintSourceTypeAvailable('team' as any, '1.21.4')).toBe(false)
	})
})

describe('normalizeTintColor', () => {
	it('masks RGB colors to 24 bits', () => {
		expect(normalizeTintColor(-1, false)).toBe(0xffffff)
		expect(normalizeTintColor(0x12345678, false)).toBe(0x345678)
	})

	it('keeps ARGB colors as signed ints', () => {
		expect(normalizeTintColor(0xffffffff, true)).toBe(-1)
		expect(normalizeTintColor(-1, true)).toBe(-1)
	})

	it('converts float arrays to opaque ints', () => {
		expect(normalizeTintColor([1, 0, 0.5], false)).toBe(0xff0080)
		expect(normalizeTintColor([1, 1, 1], true)).toBe(-1)
	})

	it('treats invalid values as black', () => {
		expect(normalizeTintColor(NaN, false)).toBe(0)
		expect(normalizeTintColor(2.9, false)).toBe(2)
	})
})

describe('hex conversion', () => {
	it('round-trips RGB colors', () => {
		expect(tintColorToHex(0x00ff80, false)).toBe('#00ff80')
		expect(tintColorFromHex('#00ff80', false)).toBe(0x00ff80)
	})

	it('round-trips ARGB colors with alpha last in the hex string', () => {
		const color = (0x80 << 24) | 0x112233
		expect(tintColorToHex(color, true)).toBe('#11223380')
		expect(tintColorFromHex('#11223380', true)).toBe(color)
	})

	it('treats a 6-digit hex as opaque when alpha is kept', () => {
		expect(tintColorFromHex('#ffffff', true)).toBe(-1)
	})
})

describe('tint source helpers', () => {
	it('creates opaque white defaults', () => {
		expect(createDefaultTintSource('minecraft:constant')).toEqual({
			type: 'minecraft:constant',
			value: 0xffffff,
		})
		expect(createDefaultTintSource('minecraft:dye')).toEqual({
			type: 'minecraft:dye',
			default: -1,
		})
		expect(createDefaultTintSource('minecraft:custom_model_data')).toEqual({
			type: 'minecraft:custom_model_data',
			index: 0,
			default: 0xffffff,
		})
	})

	it('normalizes stored colors without touching other fields', () => {
		expect(
			normalizeTintSource({
				type: 'minecraft:custom_model_data',
				index: 2,
				default: [1, 0, 0],
			})
		).toEqual({ type: 'minecraft:custom_model_data', index: 2, default: 0xff0000 })
		expect(
			normalizeTintSource({ type: 'minecraft:grass', temperature: 0.2, downfall: 0.3 })
		).toEqual({ type: 'minecraft:grass', temperature: 0.2, downfall: 0.3 })
	})

	it('keeps the color when changing type, making it opaque for alpha types', () => {
		expect(
			changeTintSourceType({ type: 'minecraft:constant', value: 0x123456 }, 'minecraft:dye')
		).toEqual({ type: 'minecraft:dye', default: (0xff << 24) | 0x123456 })
	})

	it('keeps alpha only between alpha types', () => {
		const translucent = (0x40 << 24) | 0x123456
		expect(
			changeTintSourceType(
				{ type: 'minecraft:dye', default: translucent },
				'minecraft:firework'
			)
		).toEqual({ type: 'minecraft:firework', default: translucent })
		expect(
			changeTintSourceType({ type: 'minecraft:dye', default: translucent }, 'minecraft:team')
		).toEqual({ type: 'minecraft:team', default: 0x123456 })
	})

	it('uses defaults when either type has no color', () => {
		expect(
			changeTintSourceType({ type: 'minecraft:constant', value: 0x123456 }, 'minecraft:grass')
		).toEqual({ type: 'minecraft:grass', temperature: 0.5, downfall: 1 })
		expect(
			changeTintSourceType(
				{ type: 'minecraft:grass', temperature: 0, downfall: 0 },
				'minecraft:potion'
			)
		).toEqual({ type: 'minecraft:potion', default: 0xffffff })
	})
})
