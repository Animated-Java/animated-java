import { describe, expect, it } from '@jest/globals'
import {
	CollectionParseError,
	type CollectionSettings,
	findDuplicates,
	getMemberSettings,
	parseCollection,
	rebasePackPath,
	relativeTo,
	resolveFrom,
	resolveMemberPaths,
	serializeCollection,
} from '../../collections/collectionFile'

const DEFAULTS: CollectionSettings = {
	target_minecraft_version: '26.2',
	resource_pack_export_mode: 'folder',
	data_pack_export_mode: 'folder',
	resource_pack: '',
	data_pack: '',
}

const COLLECTION_PATH = '/work/project/mobs.bpcollection'

describe('parseCollection', () => {
	it('fills missing settings and blueprints from defaults', () => {
		const collection = parseCollection({ format_version: 1, uuid: 'abc' }, DEFAULTS)
		expect(collection).toEqual({
			format_version: 1,
			uuid: 'abc',
			settings: DEFAULTS,
			blueprints: [],
		})
	})

	it('keeps given settings and ignores unknown keys', () => {
		const collection = parseCollection(
			{
				format_version: 1,
				uuid: 'abc',
				settings: { data_pack_export_mode: 'zip', data_pack: './dp.zip', extra: 1 },
				blueprints: ['./a.ajblueprint'],
			},
			DEFAULTS
		)
		expect(collection.settings.data_pack_export_mode).toBe('zip')
		expect(collection.settings.data_pack).toBe('./dp.zip')
		expect(collection.settings).not.toHaveProperty('extra')
		expect(collection.blueprints).toEqual(['./a.ajblueprint'])
	})

	it.each([
		['a non-object', []],
		['a missing format_version', { uuid: 'abc' }],
		['a newer format_version', { format_version: 2, uuid: 'abc' }],
		['a missing uuid', { format_version: 1 }],
		['non-string blueprints', { format_version: 1, uuid: 'abc', blueprints: [1] }],
		['a non-string setting', { format_version: 1, uuid: 'abc', settings: { data_pack: 1 } }],
		[
			'an unknown export mode',
			{ format_version: 1, uuid: 'abc', settings: { data_pack_export_mode: 'tar' } },
		],
	])('rejects %s', (_, json) => {
		expect(() => parseCollection(json, DEFAULTS)).toThrow(CollectionParseError)
	})

	it('round-trips through serializeCollection', () => {
		const collection = parseCollection(
			{ format_version: 1, uuid: 'abc', blueprints: ['./a.ajblueprint'] },
			DEFAULTS
		)
		expect(parseCollection(JSON.parse(serializeCollection(collection)), DEFAULTS)).toEqual(
			collection
		)
	})
})

describe('paths', () => {
	it('relativeTo prefixes sibling paths with ./', () => {
		expect(relativeTo(COLLECTION_PATH, '/work/project/a.ajblueprint')).toBe('./a.ajblueprint')
		expect(relativeTo(COLLECTION_PATH, '/work/other/a.ajblueprint')).toBe(
			'../other/a.ajblueprint'
		)
	})

	it('resolveFrom resolves relative paths and leaves others alone', () => {
		expect(resolveFrom(COLLECTION_PATH, './packs/dp')).toBe('/work/project/packs/dp')
		expect(resolveFrom(COLLECTION_PATH, '/abs/dp')).toBe('/abs/dp')
		expect(resolveFrom(COLLECTION_PATH, '%APPDATA%/dp')).toBe('%APPDATA%/dp')
	})

	it('rebasePackPath rewrites relative pack paths for a member elsewhere', () => {
		const blueprint = '/work/project/models/a.ajblueprint'
		expect(rebasePackPath(COLLECTION_PATH, blueprint, './packs/dp')).toBe('../packs/dp')
		expect(rebasePackPath(COLLECTION_PATH, blueprint, '/abs/dp')).toBe('/abs/dp')
	})

	it('getMemberSettings rebases only the pack paths', () => {
		const collection = parseCollection(
			{
				format_version: 1,
				uuid: 'abc',
				settings: {
					resource_pack: './rp',
					data_pack: './dp',
					target_minecraft_version: '1.21.4',
				},
			},
			DEFAULTS
		)
		expect(
			getMemberSettings(collection, COLLECTION_PATH, '/work/project/models/a.ajblueprint')
		).toEqual({
			...DEFAULTS,
			target_minecraft_version: '1.21.4',
			resource_pack: '../rp',
			data_pack: '../dp',
		})
	})

	it('resolveMemberPaths resolves relative and absolute members', () => {
		const collection = parseCollection(
			{
				format_version: 1,
				uuid: 'abc',
				blueprints: ['./a.ajblueprint', '/abs/b.ajblueprint'],
			},
			DEFAULTS
		)
		expect(resolveMemberPaths(collection, COLLECTION_PATH)).toEqual([
			'/work/project/a.ajblueprint',
			'/abs/b.ajblueprint',
		])
	})

	it('findDuplicates lists each repeated path once', () => {
		expect(findDuplicates(['a', 'b', 'a', 'a', 'c'])).toEqual(['a'])
		expect(findDuplicates(['a', 'b'])).toEqual([])
	})
})
