import { beforeAll, describe, expect, it } from '@jest/globals'
import {
	buildAtlasSource,
	getPaletteId,
	getPaletteImagePath,
	getSpriteId,
	getTextureImagePath,
	supportsSeparator,
} from '../../palettes/atlas'
import {
	checkPaletteSet,
	toSuffix,
	uniqueSuffix,
	type IPaletteCheckInput,
} from '../../palettes/checks'
import {
	colorsFromPixels,
	extractKey,
	findDuplicateKeyColors,
	fromPanelColor,
	mapToKey,
	mergeKey,
	parseHex,
	pixelsFromColors,
	recolor,
	toHex,
	toPanelColor,
} from '../../palettes/recolor'

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

const px = (...colors: string[]) => pixelsFromColors(colors)
const KEY = ['#e0e0e0ff', '#808080ff', '#202020ff']
const GOLD = ['#fffd90ff', '#e9b115ff', '#6f4e06ff']

describe('hex colors', () => {
	it('round-trips through pixels', () => {
		const colors = ['#01020304', '#ffffffff', '#00000000']
		expect(colorsFromPixels(pixelsFromColors(colors))).toEqual(colors)
	})

	it('expands short and alpha-less hex', () => {
		expect(parseHex('#fff')).toEqual([255, 255, 255, 255])
		expect(parseHex('102030')).toEqual([16, 32, 48, 255])
		expect(toHex(16, 32, 48)).toBe('#102030ff')
	})
})

describe('Palette panel colors', () => {
	it('drops opaque alpha and keeps translucent alpha', () => {
		expect(toPanelColor('#E0E0E0FF')).toBe('#e0e0e0')
		expect(toPanelColor('#10203080')).toBe('#10203080')
		expect(toPanelColor('#10203000')).toBe('#10203000')
	})

	it('reads any hex form back as #rrggbbaa', () => {
		expect(fromPanelColor('#e0e0e0')).toBe('#e0e0e0ff')
		expect(fromPanelColor('#FFF')).toBe('#ffffffff')
		expect(fromPanelColor('#10203080')).toBe('#10203080')
	})

	it('round-trips strip colors', () => {
		const colors = ['#e0e0e0ff', '#10203080', '#00000000']
		expect(colors.map(toPanelColor).map(fromPanelColor)).toEqual(colors)
	})

	it("rejects colors that aren't hex", () => {
		expect(fromPanelColor('red')).toBeUndefined()
		expect(fromPanelColor('#12345')).toBeUndefined()
		expect(fromPanelColor('rgb(1, 2, 3)')).toBeUndefined()
	})
})

describe('suffixes', () => {
	it('turns names and ids into valid suffixes', () => {
		expect(toSuffix('Gold Trim.png')).toBe('gold_trim')
		expect(toSuffix('minecraft:trims/color_palettes/gold')).toBe('gold')
		expect(toSuffix('')).toBe('palette')
	})

	it('numbers taken suffixes', () => {
		expect(uniqueSuffix('gold', [])).toBe('gold')
		expect(uniqueSuffix('gold', ['gold', 'gold_2'])).toBe('gold_3')
	})
})

describe('recolor', () => {
	it('swaps key colors for the palette color at the same index', () => {
		const out = recolor(px('#808080ff', '#e0e0e0ff'), KEY, GOLD)
		expect(colorsFromPixels(out)).toEqual(['#e9b115ff', '#fffd90ff'])
	})

	it('copies unmatched and transparent pixels as-is', () => {
		const out = recolor(px('#3ad0ffff', '#80808000'), KEY, GOLD)
		expect(colorsFromPixels(out)).toEqual(['#3ad0ffff', '#80808000'])
	})

	it('matches by RGB only and multiplies alpha, rounding down like Minecraft', () => {
		const out = recolor(px('#80808080'), KEY, ['#000000ff', '#ff000080', '#000000ff'])
		// 128 * 128 / 255 = 64.25
		expect(colorsFromPixels(out)).toEqual(['#ff000040'])
	})

	it('skips transparent key pixels and uses the last of a repeated key color', () => {
		const key = ['#808080ff', '#e0e0e000', '#808080ff']
		const out = recolor(px('#808080ff', '#e0e0e0ff'), key, [
			'#111111ff',
			'#222222ff',
			'#333333ff',
		])
		expect(colorsFromPixels(out)).toEqual(['#333333ff', '#e0e0e0ff'])
	})

	it('throws when the palette and key lengths differ', () => {
		expect(() => recolor(px('#808080ff'), KEY, GOLD.slice(1))).toThrow(/2 colors.*3/)
	})
})

describe('extractKey', () => {
	it('collects unique opaque colors from every image, light to dark', () => {
		const key = extractKey([
			px('#202020ff', '#e0e0e0ff', '#ff000000'),
			px('#808080ff', '#202020ff'),
		])
		expect(key).toEqual(['#e0e0e0ff', '#808080ff', '#202020ff'])
	})

	it('breaks luminance ties by RGB value', () => {
		expect(extractKey([px('#000001ff', '#000002ff')])).toEqual(['#000002ff', '#000001ff'])
	})
})

describe('mergeKey', () => {
	it('keeps existing positions and appends new colors', () => {
		expect(mergeKey(['#808080ff', '#202020ff'], ['#e0e0e0ff', '#808080ff'])).toEqual([
			'#808080ff',
			'#202020ff',
			'#e0e0e0ff',
		])
	})
})

describe('key analysis', () => {
	it('finds repeated key colors, ignoring transparent ones', () => {
		expect(
			findDuplicateKeyColors(['#808080ff', '#80808000', '#808080aa', '#101010ff'])
		).toEqual(['#808080'])
	})
})

describe('mapToKey', () => {
	const key = ['#e0e0e0ff', '#808080ff', '#20202000']
	const gold = ['#ffff00ff', '#aa8800ff', '#553300ff']

	it('maps a palette color to the key color at its position', () => {
		expect(mapToKey('#aa8800', key, gold)).toEqual({ color: '#808080', inKey: true })
	})

	it('keeps key colors as they are', () => {
		expect(mapToKey('#e0e0e0', key, gold)).toEqual({ color: '#e0e0e0', inKey: true })
		expect(mapToKey('#808080', key, undefined)).toEqual({ color: '#808080', inKey: true })
	})

	it('flags colors outside the key and palette, keeping them as they are', () => {
		expect(mapToKey('#3ad0ff', key, gold)).toEqual({ color: '#3ad0ff', inKey: false })
	})

	it("skips transparent key positions, which Minecraft doesn't recolor", () => {
		expect(mapToKey('#553300', key, gold)).toEqual({ color: '#553300', inKey: false })
	})

	it("ignores a palette that doesn't fit the key", () => {
		expect(mapToKey('#ffff00', key, ['#ffff00ff'])).toEqual({ color: '#ffff00', inKey: false })
	})
})

describe('palette ids', () => {
	it('resolves palette images under textures/ before 26.3', () => {
		expect(getPaletteImagePath('minecraft:trims/color_palettes/gold', '26.2')).toBe(
			'assets/minecraft/textures/trims/color_palettes/gold.png'
		)
	})

	it('resolves palette images under textures/palettes/ from 26.3', () => {
		expect(getPaletteImagePath('trims/color_palettes/gold', '26.3')).toBe(
			'assets/minecraft/textures/palettes/trims/color_palettes/gold.png'
		)
	})

	it('ids the same palette file differently across 26.3', () => {
		expect(getPaletteId('my_pack', 'blueprint/rig/armor/key', '1.21.4')).toBe(
			'my_pack:palettes/blueprint/rig/armor/key'
		)
		expect(getPaletteId('my_pack', 'blueprint/rig/armor/key', '26.3')).toBe(
			'my_pack:blueprint/rig/armor/key'
		)
	})

	it('builds texture paths and sprite ids', () => {
		expect(getTextureImagePath('a:b/c')).toBe('assets/a/textures/b/c.png')
		expect(getSpriteId('a:b/c', '-', 'gold')).toBe('a:b/c-gold')
	})

	it('only supports separators from 1.21.5', () => {
		expect(supportsSeparator('1.21.4')).toBe(false)
		expect(supportsSeparator('1.21.5')).toBe(true)
	})
})

describe('buildAtlasSource', () => {
	const options = { bases: ['a:b'], key: 'a:k', permutations: { gold: 'a:g' } }

	it('leaves out the default separator', () => {
		expect(buildAtlasSource({ ...options, separator: '_' })).toEqual({
			type: 'paletted_permutations',
			textures: ['a:b'],
			palette_key: 'a:k',
			permutations: { gold: 'a:g' },
		})
	})

	it('writes a custom separator', () => {
		expect(buildAtlasSource({ ...options, separator: '-' }).separator).toBe('-')
	})
})

describe('checkPaletteSet', () => {
	const input = (overrides: Partial<IPaletteCheckInput> = {}): IPaletteCheckInput => ({
		version: '26.2',
		separator: '_',
		key: KEY,
		permutations: [{ suffix: 'gold', colors: GOLD }],
		bases: [{ name: 'armor', pixels: px(...KEY) }],
		...overrides,
	})
	const codes = (i: IPaletteCheckInput) => checkPaletteSet(i).map(x => `${x.severity}:${x.code}`)

	it('passes a complete set', () => {
		expect(checkPaletteSet(input())).toEqual([])
	})

	it('errors on a palette whose length differs from the key', () => {
		expect(
			checkPaletteSet(input({ permutations: [{ suffix: 'gold', colors: GOLD.slice(1) }] }))
		).toEqual([{ severity: 'error', code: 'palette_length', args: ['gold', '2', '3'] }])
	})

	it('errors on invalid and duplicate suffixes', () => {
		const permutations = [
			{ suffix: 'Gold!', colors: GOLD },
			{ suffix: 'gold', colors: GOLD },
			{ suffix: 'gold', colors: GOLD },
		]
		expect(codes(input({ permutations }))).toEqual([
			'error:invalid_suffix',
			'error:duplicate_suffix',
		])
	})

	it('errors on a custom separator before 1.21.5, and on invalid separators', () => {
		expect(codes(input({ separator: '-', version: '1.21.4' }))).toEqual([
			'error:separator_unsupported',
		])
		expect(codes(input({ separator: '-', version: '1.21.5' }))).toEqual([])
		expect(codes(input({ separator: ' ' }))).toEqual(['error:invalid_separator'])
	})

	it('checks palettes against an empty key', () => {
		expect(codes(input({ key: [] }))).toEqual(['error:no_key', 'error:palette_length'])
	})

	it('flags empty parts, duplicate key colors and unreadable strips', () => {
		expect(codes(input({ bases: [], permutations: [], key: [] }))).toEqual([
			'warning:no_bases',
			'warning:no_permutations',
			'error:no_key',
		])
		expect(codes(input({ key: [...KEY, KEY[0]], permutations: [] }))).toEqual([
			'warning:no_permutations',
			'warning:duplicate_key_color',
		])
		expect(
			codes(
				input({
					key: undefined,
					permutations: [{ suffix: 'gold', colors: undefined }],
					bases: [{ name: 'armor', pixels: undefined }],
				})
			)
		).toEqual([
			'warning:key_unreadable',
			'warning:palette_unreadable',
			'warning:base_unreadable',
		])
	})

	it("doesn't flag base colors the key misses, since they're left as they are", () => {
		expect(
			checkPaletteSet(input({ bases: [{ name: 'armor', pixels: px('#3ad0ffff') }] }))
		).toEqual([])
	})
})
