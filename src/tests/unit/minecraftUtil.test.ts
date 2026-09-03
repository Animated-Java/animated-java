import { describe, expect, it } from '@jest/globals'
import {
	getPathFromResourceLocation,
	isDataPackPath,
	isResourcePackPath,
	parseDataPackPath,
	parseResourceLocation,
	parseResourcePackPath,
	resolveBlockstateValueType,
	sanitizeStorageKey,
	stringifyBlock,
	toSmallCaps,
} from '../../util/minecraftUtil'

// These helpers use POSIX path semantics via the `PathModule` global, which
// `src/tests/unit/setup.ts` binds to `node:path` (POSIX on Linux CI/dev).

describe('toSmallCaps', () => {
	it('lowercases before mapping', () => {
		expect(toSmallCaps('A')).toBe(toSmallCaps('a'))
	})

	it('preserves length and non-latin / punctuation characters', () => {
		expect([...toSmallCaps('abc')]).toHaveLength(3)
		expect(toSmallCaps('hi there!')).toContain(' ')
		expect(toSmallCaps('hi there!').endsWith('!')).toBe(true)
		expect(toSmallCaps('日本語')).toBe('日本語')
	})
})

describe('sanitizeStorageKey', () => {
	it('lowercases and collapses invalid runs to a single underscore', () => {
		expect(sanitizeStorageKey('My Cool Key!')).toBe('my_cool_key_')
		expect(sanitizeStorageKey('a  b')).toBe('a_b')
		expect(sanitizeStorageKey('already_valid_123')).toBe('already_valid_123')
	})
})

describe('getPathFromResourceLocation', () => {
	it('expands a namespaced location under assets/<ns>/<type>/', () => {
		expect(getPathFromResourceLocation('minecraft:block/stone', 'models')).toBe(
			'assets/minecraft/models/block/stone'
		)
		expect(getPathFromResourceLocation('mypack:custom/thing', 'textures')).toBe(
			'assets/mypack/textures/custom/thing'
		)
	})

	it('defaults a bare path to the minecraft namespace', () => {
		expect(getPathFromResourceLocation('stone', 'textures')).toBe(
			'assets/minecraft/textures/stone'
		)
	})

	it('throws on an empty location', () => {
		expect(() => getPathFromResourceLocation('', 'models')).toThrow()
	})
})

describe('parseResourceLocation', () => {
	it('splits namespace / path / type and parses the tail', () => {
		expect(parseResourceLocation('minecraft:block/oak_log')).toMatchObject({
			namespace: 'minecraft',
			path: 'block/oak_log',
			type: 'block',
			dir: 'block',
			name: 'oak_log',
			fullPath: 'minecraft/block/oak_log',
		})
	})

	it('defaults the namespace to minecraft', () => {
		expect(parseResourceLocation('stone')).toMatchObject({
			namespace: 'minecraft',
			path: 'stone',
			type: 'stone',
			name: 'stone',
		})
	})
})

describe('parseResourcePackPath', () => {
	it('pulls apart a valid resource-pack texture path', () => {
		expect(
			parseResourcePackPath('pack/assets/minecraft/textures/block/stone.png')
		).toMatchObject({
			packRoot: 'pack',
			namespace: 'minecraft',
			type: 'textures',
			resourcePath: 'block',
			resourceLocation: 'minecraft:block/stone',
			fileName: 'stone',
			fileExtension: '.png',
		})
	})

	it('rejects a non-lowercase file name', () => {
		expect(parseResourcePackPath('pack/assets/minecraft/textures/Stone.png')).toBeUndefined()
	})

	it('returns undefined when there is no assets/ segment', () => {
		expect(parseResourcePackPath('some/other/file.png')).toBeUndefined()
	})
})

describe('isResourcePackPath', () => {
	it('is true only for a real resource-pack layout', () => {
		expect(isResourcePackPath('pack/assets/ns/textures/item/x.png')).toBe(true)
		expect(isResourcePackPath('random/path.txt')).toBe(false)
	})
})

describe('parseDataPackPath', () => {
	it('pulls apart a function path', () => {
		expect(parseDataPackPath('dp/data/myns/function/anim/walk.mcfunction')).toMatchObject({
			packRoot: 'dp',
			namespace: 'myns',
			type: 'function',
			resourcePath: 'anim',
			resourceLocation: 'myns:anim/walk',
			fileName: 'walk',
		})
	})

	it('drops the extra category segment for a tags path', () => {
		expect(parseDataPackPath('data/myns/tags/function/things.json')).toMatchObject({
			namespace: 'myns',
			type: 'tags',
			resourcePath: '',
			resourceLocation: 'myns:things',
		})
	})
})

describe('isDataPackPath', () => {
	it('is true only for a real data-pack layout', () => {
		expect(isDataPackPath('dp/data/ns/function/x/y.mcfunction')).toBe(true)
		expect(isDataPackPath('foo/bar')).toBe(false)
	})
})

describe('resolveBlockstateValueType', () => {
	it('coerces booleans and numbers, leaves strings alone', () => {
		expect(resolveBlockstateValueType('true', false)).toBe(true)
		expect(resolveBlockstateValueType('false', false)).toBe(false)
		expect(resolveBlockstateValueType('3', false)).toBe(3)
		expect(resolveBlockstateValueType('north', false)).toBe('north')
	})

	it('splits pipe lists only when arrays are allowed', () => {
		expect(resolveBlockstateValueType('1|2|foo', true)).toEqual([1, 2, 'foo'])
		expect(resolveBlockstateValueType('a|b', false)).toBe('a|b')
	})
})

describe('stringifyBlock', () => {
	it('returns the bare location when no states differ from the defaults', () => {
		expect(
			stringifyBlock(
				'minecraft:oak_stairs',
				{ facing: 'north', half: 'bottom' },
				{ facing: 'north', half: 'bottom' }
			)
		).toBe('minecraft:oak_stairs')
	})

	it('emits only the states that differ from the defaults', () => {
		expect(
			stringifyBlock(
				'minecraft:oak_stairs',
				{ facing: 'north', half: 'top', waterlogged: false },
				{ facing: 'north', half: 'bottom', waterlogged: false }
			)
		).toBe('minecraft:oak_stairs[half=top]')
	})

	it('emits every state when no defaults are provided', () => {
		expect(stringifyBlock('minecraft:lever', { face: 'wall', powered: true })).toBe(
			'minecraft:lever[face=wall,powered=true]'
		)
	})

	it('stringifies boolean and number values', () => {
		expect(
			stringifyBlock('minecraft:note_block', { note: 5, powered: true }, { note: 0, powered: false })
		).toBe('minecraft:note_block[note=5,powered=true]')
	})
})
