import { describe, expect, it } from '@jest/globals'
import { blockbench } from '@snavesutit/jestbench'
import * as fs from 'node:fs'
import * as path from 'node:path'

/**
 * Migration safety net: load every committed sample project through the codec's
 * real `load` path (which runs the DFU upgrade chain in `dfu.ts`) and assert it
 * lands on a modern, parseable project.
 *
 * These fixtures span format versions from an ancient `.ajmodel` (`1.4`) up to
 * `1.10.0-beta.6`, so a broken migration step surfaces here.
 */
const BLUEPRINT_FORMAT_ID = 'animated-java:format/blueprint'

const REPO_ROOT = process.cwd()

// Committed fixtures only - the huge untracked `full_stage*` blueprints are
// skipped on purpose (100+ MB each).
const FIXTURES: Array<{ name: string; file: string }> = [
	{ name: 'test_blueprint (1.0.0)', file: 'test_blueprints/test_blueprint.ajblueprint' },
	{ name: 'text_display (1.0.0)', file: 'test_blueprints/text_display.ajblueprint' },
	{ name: 'item_display (1.4.2)', file: 'test_blueprints/item_display.ajblueprint' },
	{ name: 'player (1.0.0)', file: 'test_blueprints/player.ajblueprint' },
	{ name: 'blockstates (1.4.0)', file: 'test_blueprints/blockstates.ajblueprint' },
	{ name: 'block_display (1.5.2)', file: 'test_blueprints/block_display.ajblueprint' },
	{
		name: 'ajbooth_witch_broom (1.5.2)',
		file: 'test_blueprints/ajbooth_witch_broom.ajblueprint',
	},
	{ name: 'armor_stand (1.10.0-beta.6)', file: 'test_blueprints/armor_stand.ajblueprint' },
	// A pre-blueprint `.ajmodel` (format `1.4`): exercises the `old-1.x` upgrade
	// chain that converts the old model format into a blueprint.
	{ name: 'armor_stand.ajmodel (1.4)', file: 'test_ajmodels/armor_stand.ajmodel' },
]

describe('Blueprint fixtures: migrate + load', () => {
	it.each(FIXTURES)(
		'$name',
		async ({ file }) => {
			const absPath = path.resolve(REPO_ROOT, file)
			const raw = fs.readFileSync(absPath, 'utf-8')

			const result = await blockbench.evaluate(
				(args: { formatId: string; raw: string; name: string; path: string }) => {
					const aj = (window as any).AnimatedJava
					const codec = aj.BLUEPRINT_CODEC.get()
					const g = globalThis as any

					// Start from a clean slate.
					g.newProject(g.Formats[args.formatId])

					const model = JSON.parse(args.raw)
					const originalVersion = model?.meta?.format_version

					// `no_file` keeps `load` from touching the recent-projects list /
					// thumbnail writer while still giving it a path to name from.
					codec.load(model, { name: args.name, path: args.path, no_file: true })

					return {
						originalVersion,
						loadedFormat: Project?.format?.id,
						hasSettings: !!Project?.animated_java,
						blueprintId: Project?.animated_java?.blueprint_id,
						targetVersion: Project?.animated_java?.target_minecraft_version,
						groupCount: Group.all.length,
						elementCount: Outliner.elements.length,
						variantCount: aj.Variant.all.length,
						hasDefaultVariant: aj.Variant.all.some((v: any) => v.isDefault),
					}
				},
				{ formatId: BLUEPRINT_FORMAT_ID, raw, name: file, path: absPath }
			)

			expect(result.loadedFormat).toBe(BLUEPRINT_FORMAT_ID)
			expect(result.hasSettings).toBe(true)
			// Migration must fill in the modern settings shape.
			expect(typeof result.blueprintId).toBe('string')
			expect(result.blueprintId!.length).toBeGreaterThan(0)
			expect(typeof result.targetVersion).toBe('string')
			// Every project has exactly one default variant after load.
			expect(result.hasDefaultVariant).toBe(true)
			expect(result.variantCount).toBeGreaterThanOrEqual(1)
		},
		120_000
	)
})
