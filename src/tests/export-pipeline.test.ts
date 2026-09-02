import { describe, expect, it } from '@jest/globals'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { relFiles, runFixtureExport } from './helpers/export'

/**
 * End-to-end smoke test for the whole export pipeline: rig render -> animation
 * render -> data-pack compile -> resource-pack compile -> files on disk.
 *
 * Uses the committed `text_display` fixture (a single text-display node, no
 * custom models or textures) so the run stays fast and deterministic while
 * still driving `exportProject` exactly as the "Export" button does.
 */
const FIXTURE = 'test_blueprints/text_display.ajblueprint'

describe('Export pipeline', () => {
	it('writes a data pack and resource pack to disk', async () => {
		const run = await runFixtureExport({ fixture: FIXTURE })
		try {
			expect(run.ok).toBe(true)

			const dataPackFiles = relFiles(run.dataPackFolder)
			const mcfunctions = dataPackFiles.filter(f => f.endsWith('.mcfunction'))

			// The compiled data pack has the expected shape.
			expect(dataPackFiles).toContain('pack.mcmeta')
			expect(fs.existsSync(path.join(run.dataPackFolder, 'data'))).toBe(true)
			// A rig with one node still emits the core control functions
			// (load / install / tick / summon / remove / animation drivers).
			expect(mcfunctions.length).toBeGreaterThan(5)

			// Standard entrypoints wired into the minecraft:load / :tick tags.
			expect(dataPackFiles).toContain('data/minecraft/tags/function/load.json')
			expect(dataPackFiles).toContain('data/minecraft/tags/function/tick.json')
			// The shared Animated Java runtime.
			expect(dataPackFiles).toContain('data/animated_java/function/global/on_load.mcfunction')
			// The project's own namespace, with its summon + load functions.
			const nsFunctions = mcfunctions.filter(
				f => f.startsWith('data/') && f.includes('/function/') && !f.includes('/global/')
			)
			expect(nsFunctions.some(f => f.endsWith('/summon.mcfunction'))).toBe(true)
			expect(nsFunctions.some(f => f.endsWith('/on_load.mcfunction'))).toBe(true)

			// The resource pack compiler ran without clobbering the target folder.
			expect(fs.existsSync(path.join(run.resourcePackFolder, 'pack.mcmeta'))).toBe(true)
		} finally {
			run.cleanup()
		}
	}, 120_000)

	// One version per `getMCBFilesByVersion` branch: the 1.20.4 core templates,
	// the 1.21.5 set, and the 26.2 global. First run downloads each version's
	// assets into `~/.envbench`.
	it.each(['1.20.4', '1.21.5', '26.2'])(
		'compiles a working data pack for target %s',
		async version => {
			const run = await runFixtureExport({ fixture: FIXTURE, targetVersion: version })
			try {
				expect(run.ok).toBe(true)
				const dataPackFiles = relFiles(run.dataPackFolder)
				// Pre-1.21 packs use `tags/functions/` (plural), 1.21+ `tags/function/`.
				expect(
					dataPackFiles.some(f =>
						/^data\/minecraft\/tags\/functions?\/load\.json$/.test(f)
					)
				).toBe(true)
				expect(dataPackFiles.filter(f => f.endsWith('.mcfunction')).length).toBeGreaterThan(
					5
				)
			} finally {
				run.cleanup()
			}
		},
		180_000
	)
})
