import { beforeAll, describe, expect, it } from '@jest/globals'
import {
	atlasIncludesSprite,
	findItemModelAtlasProblems,
	findSpriteAtlas,
	getItemModelAtlases,
	type TextureAtlasEntry,
} from '../../systems/minecraft/textureAtlas'

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

const BLOCKS: TextureAtlasEntry[] = [
	{ type: 'directory', source: 'block', prefix: 'block/' },
	{ type: 'directory', source: 'blueprint', prefix: 'blueprint/' },
	{ type: 'single', resource: 'minecraft:entity/bell/bell_body' },
]
const ITEMS: TextureAtlasEntry[] = [
	{ type: 'directory', source: 'item', prefix: 'item/' },
	{
		type: 'paletted_permutations',
		textures: ['minecraft:trims/items/helmet_trim'],
		palette_key: 'minecraft:trims/color_palettes/trim_palette',
		permutations: { gold: 'minecraft:trims/color_palettes/gold' },
	},
]
const ATLASES = new Map([
	['blocks', BLOCKS],
	['items', ITEMS],
])

describe('atlasIncludesSprite', () => {
	it('matches directory sources by prefix in any namespace', () => {
		expect(atlasIncludesSprite(BLOCKS, 'minecraft:block/stone')).toBe(true)
		expect(atlasIncludesSprite(BLOCKS, 'my_pack:blueprint/rig/skin')).toBe(true)
		expect(atlasIncludesSprite(BLOCKS, 'minecraft:entity/zombie/zombie')).toBe(false)
	})

	it('treats ids without a namespace as minecraft', () => {
		expect(atlasIncludesSprite(BLOCKS, 'entity/bell/bell_body')).toBe(true)
	})

	it('uses the sprite name of a single source when it has one', () => {
		const sources: TextureAtlasEntry[] = [
			{
				type: 'minecraft:single' as 'single',
				resource: 'a:tex/raw',
				sprite: 'a:tex/renamed',
			},
		]
		expect(atlasIncludesSprite(sources, 'a:tex/renamed')).toBe(true)
		expect(atlasIncludesSprite(sources, 'a:tex/raw')).toBe(false)
	})

	it('includes unstitched regions', () => {
		const sources: TextureAtlasEntry[] = [
			{
				type: 'unstitch',
				resource: 'a:sheet',
				divisor_x: 2,
				divisor_y: 2,
				regions: [{ sprite: 'a:sheet/top', x: 0, y: 0, width: 1, height: 1 }],
			},
		]
		expect(atlasIncludesSprite(sources, 'a:sheet/top')).toBe(true)
		expect(atlasIncludesSprite(sources, 'a:sheet')).toBe(false)
	})

	it('names paletted permutations base + separator + suffix', () => {
		expect(atlasIncludesSprite(ITEMS, 'minecraft:trims/items/helmet_trim_gold')).toBe(true)
		expect(atlasIncludesSprite(ITEMS, 'minecraft:trims/items/helmet_trim')).toBe(false)
		const custom: TextureAtlasEntry[] = [
			{
				...(ITEMS[1] as Extract<TextureAtlasEntry, { type: 'paletted_permutations' }>),
				separator: '-',
			},
		]
		expect(atlasIncludesSprite(custom, 'minecraft:trims/items/helmet_trim-gold')).toBe(true)
		expect(atlasIncludesSprite(custom, 'minecraft:trims/items/helmet_trim_gold')).toBe(false)
	})

	it('lets a filter remove what earlier sources added, but not later ones', () => {
		const filter: TextureAtlasEntry = {
			type: 'filter',
			namespace: 'minecraft',
			path: 'block/.*',
		}
		expect(atlasIncludesSprite([...BLOCKS, filter], 'minecraft:block/stone')).toBe(false)
		expect(atlasIncludesSprite([...BLOCKS, filter], 'other:block/stone')).toBe(true)
		expect(atlasIncludesSprite([filter, ...BLOCKS], 'minecraft:block/stone')).toBe(true)
	})

	it('matches filter patterns against the whole namespace and path', () => {
		const filter: TextureAtlasEntry = { type: 'filter', path: 'block' }
		expect(atlasIncludesSprite([...BLOCKS, filter], 'minecraft:block/stone')).toBe(true)
	})

	it('ignores filters with invalid patterns', () => {
		const filter: TextureAtlasEntry = { type: 'filter', path: '(' }
		expect(atlasIncludesSprite([...BLOCKS, filter], 'minecraft:block/stone')).toBe(true)
	})
})

describe('getItemModelAtlases', () => {
	it('only has blocks before 1.21.11', () => {
		expect(getItemModelAtlases('1.21.10')).toEqual(['blocks'])
	})

	it('looks in items first, then blocks, from 1.21.11', () => {
		expect(getItemModelAtlases('1.21.11')).toEqual(['items', 'blocks'])
		expect(getItemModelAtlases('26.3')).toEqual(['items', 'blocks'])
	})
})

describe('findSpriteAtlas', () => {
	it('returns the first atlas in order that has the sprite', () => {
		const both = new Map([...ATLASES, ['items', [...ITEMS, ...BLOCKS]]])
		expect(findSpriteAtlas(both, ['items', 'blocks'], 'minecraft:block/stone')).toBe('items')
		expect(findSpriteAtlas(ATLASES, ['items', 'blocks'], 'minecraft:block/stone')).toBe(
			'blocks'
		)
		expect(findSpriteAtlas(ATLASES, ['blocks'], 'minecraft:item/apple')).toBeUndefined()
	})
})

describe('findItemModelAtlasProblems', () => {
	const model = (...textures: string[]) => ({ name: 'bone', textures })

	it('finds nothing for textures in one usable atlas', () => {
		expect(
			findItemModelAtlasProblems(
				[model('a:blueprint/x', 'minecraft:block/stone')],
				ATLASES,
				'1.21.4'
			)
		).toEqual([])
	})

	it('flags item textures before 1.21.11, since only blocks is usable', () => {
		expect(
			findItemModelAtlasProblems([model('minecraft:item/apple')], ATLASES, '1.21.10')
		).toEqual([{ model: 'bone', type: 'outside', textures: ['minecraft:item/apple'] }])
	})

	it('allows an items-only model from 1.21.11', () => {
		expect(
			findItemModelAtlasProblems([model('minecraft:item/apple')], ATLASES, '1.21.11')
		).toEqual([])
	})

	it('flags a model mixing items and blocks textures from 1.21.11', () => {
		expect(
			findItemModelAtlasProblems(
				[model('minecraft:item/apple', 'a:blueprint/x', 'a:blueprint/x')],
				ATLASES,
				'26.2'
			)
		).toEqual([
			{
				model: 'bone',
				type: 'mixed',
				atlases: { items: ['minecraft:item/apple'], blocks: ['a:blueprint/x'] },
			},
		])
	})

	it('reports missing textures before mixing, and skips empty models', () => {
		const problems = findItemModelAtlasProblems(
			[model(), model('minecraft:item/apple', 'minecraft:entity/zombie/zombie')],
			ATLASES,
			'26.2'
		)
		expect(problems).toEqual([
			{ model: 'bone', type: 'outside', textures: ['minecraft:entity/zombie/zombie'] },
		])
	})
})
