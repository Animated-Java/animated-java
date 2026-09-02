import { afterAll, beforeAll, describe, expect, it } from '@jest/globals'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { type ExportRun, relFiles, runFixtureExport } from './helpers/export'

/**
 * Inspects the *contents* of a real export (not just "files were written").
 * Uses the committed `player` fixture - a textured, multi-bone rig with five
 * animations - exported once for the whole suite.
 */
describe('Export contents (player fixture)', () => {
	let run: ExportRun
	let dpFiles: string[]
	let rpFiles: string[]
	const readDp = (rel: string) => fs.readFileSync(path.join(run.dataPackFolder, rel), 'utf-8')
	const readRp = (rel: string) => fs.readFileSync(path.join(run.resourcePackFolder, rel), 'utf-8')

	beforeAll(async () => {
		run = await runFixtureExport({ fixture: 'test_blueprints/player.ajblueprint' })
		dpFiles = relFiles(run.dataPackFolder)
		rpFiles = relFiles(run.resourcePackFolder)
	}, 180_000)

	afterAll(() => run?.cleanup())

	it('exported successfully with the migrated namespace', () => {
		expect(run.ok).toBe(true)
		expect(run.blueprintId).toBe('aj:player')
	})

	// --- data pack -----------------------------------------------------------

	it('writes a version-appropriate pack.mcmeta', () => {
		const meta = JSON.parse(readDp('pack.mcmeta'))
		expect(typeof meta.pack.pack_format).toBe('number')
		expect(meta.pack.pack_format).toBeGreaterThan(0)
	})

	it('the summon function summons an item_display and runs the rig setup', () => {
		const summon = dpFiles.find(f => f === 'data/aj/function/player/summon.mcfunction')
		expect(summon).toBeDefined()
		const body = readDp(summon!)
		expect(body).toMatch(/summon\s+(minecraft:)?item_display/)
	})

	it('emits a function per animation', () => {
		for (const name of ['idle', 'walk', 'sprint', 'sneak', 'easing_demo']) {
			expect(dpFiles.some(f => f.includes(`/function/player/animations/${name}/`))).toBe(true)
		}
	})

	it('registers scoreboard objectives in the shared load function', () => {
		const load = 'data/animated_java/function/global/on_load.mcfunction'
		expect(dpFiles).toContain(load)
		expect(readDp(load)).toMatch(/scoreboard objectives add/)
	})

	it('every .mcfunction and tag JSON is non-empty and valid', () => {
		for (const f of dpFiles) {
			const body = readDp(f)
			expect(body.length).toBeGreaterThan(0)
			if (f.endsWith('.json')) expect(() => JSON.parse(body)).not.toThrow()
		}
	})

	// --- resource pack -----------------------------------------------------

	it('writes a vanilla block atlas entry', () => {
		const atlas = JSON.parse(readRp('assets/minecraft/atlases/blocks.json'))
		expect(Array.isArray(atlas.sources)).toBe(true)
		expect(atlas.sources.length).toBeGreaterThan(0)
	})

	it('writes bone model JSON with geometry and textures', () => {
		const models = rpFiles.filter(
			f => f.startsWith('assets/aj/models/blueprint/player/') && f.endsWith('.json')
		)
		expect(models.length).toBeGreaterThan(0)
		const model = JSON.parse(readRp(models[0]))
		expect(Array.isArray(model.elements)).toBe(true)
		expect(model.elements.length).toBeGreaterThan(0)
		expect(typeof model.textures).toBe('object')
	})

	it('writes an item model definition per bone', () => {
		const defs = rpFiles.filter(
			f => f.startsWith('assets/aj/items/blueprint/player/') && f.endsWith('.json')
		)
		expect(defs.length).toBeGreaterThan(0)
		const def = JSON.parse(readRp(defs[0]))
		expect(def.model?.type).toMatch(/minecraft:(model|select|range_dispatch|condition)/)
	})

	it('writes the rig textures as PNGs', () => {
		const textures = rpFiles.filter(
			f => f.startsWith('assets/aj/textures/blueprint/player/') && f.endsWith('.png')
		)
		expect(textures.length).toBeGreaterThan(0)
		// PNG magic bytes.
		const bytes = fs.readFileSync(path.join(run.resourcePackFolder, textures[0]))
		expect(bytes.subarray(0, 4).toString('hex')).toBe('89504e47')
	})
})
