import { afterAll, beforeAll, describe, expect, it } from '@jest/globals'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { type ExportRun, runFixtureExport } from './helpers/export'

/** Every version field, as an export for another version or the pack's author may leave them. */
const STALE_PACK_META = {
	pack: {
		description: 'My pack',
		pack_format: 48,
		supported_formats: [48, 61],
		min_format: 88,
		max_format: 94,
	},
	filter: { block: [{ namespace: 'example', path: '.*' }] },
}

// 1.21.8 is the last version with legacy pack formats, 1.21.9 the first with min/max formats.
describe.each([
	[
		'1.21.8',
		{ pack_format: 81, supported_formats: { min_inclusive: 81, max_inclusive: 81 } },
		{ pack_format: 64, supported_formats: { min_inclusive: 64, max_inclusive: 64 } },
	],
	['1.21.9', { min_format: 88, max_format: 88 }, { min_format: 69, max_format: 69 }],
])('pack.mcmeta (%s)', (targetVersion, dataPackFormat, resourcePackFormat) => {
	let run: ExportRun
	const read = (folder: string) =>
		JSON.parse(fs.readFileSync(path.join(folder, 'pack.mcmeta'), 'utf-8'))

	beforeAll(async () => {
		run = await runFixtureExport({
			fixture: 'test_blueprints/Dummy.ajblueprint',
			targetVersion,
			packMeta: STALE_PACK_META,
		})
	}, 180_000)

	afterAll(() => run?.cleanup())

	it('exports', () => {
		expect(run.ok).toBe(true)
	})

	it("replaces stale version fields with the target's, keeping the rest", () => {
		expect(read(run.dataPackFolder)).toEqual({
			pack: { description: 'My pack', ...dataPackFormat },
			filter: STALE_PACK_META.filter,
		})
		expect(read(run.resourcePackFolder)).toEqual({
			pack: { description: 'My pack', ...resourcePackFormat },
			filter: STALE_PACK_META.filter,
		})
	})
})
