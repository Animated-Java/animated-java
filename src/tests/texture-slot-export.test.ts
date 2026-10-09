import { afterAll, beforeAll, describe, expect, it } from '@jest/globals'
import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'
import { type ExportRun, relFiles, repoPath, runFixtureExport } from './helpers/export'

/**
 * The `Dummy` fixture migrates to one Texture Slot (`dummy_unpainted_slot`) holding seven colors, with
 * one Variant per color. 1.21.4+ swaps slots through `custom_model_data` strings; older targets
 * bake a model per Variant.
 */
const FIXTURE = 'test_blueprints/Dummy.ajblueprint'

function readAll(folder: string, files: string[]) {
	return files.map(f => fs.readFileSync(path.join(folder, f), 'utf-8')).join('\n')
}

describe('Texture Slot export (1.21.4)', () => {
	let run: ExportRun
	let dpFiles: string[]
	let rpFiles: string[]
	const readRp = (rel: string) => fs.readFileSync(path.join(run.resourcePackFolder, rel), 'utf-8')

	beforeAll(async () => {
		run = await runFixtureExport({ fixture: FIXTURE, targetVersion: '1.21.4' })
		dpFiles = relFiles(run.dataPackFolder)
		rpFiles = relFiles(run.resourcePackFolder)
	}, 180_000)

	afterAll(() => run?.cleanup())

	it('exports', () => {
		expect(run.ok).toBe(true)
	})

	it('writes a function per slot texture that sets the slot string on each bone', () => {
		const functions = dpFiles.filter(f => f.includes('/texture_slots/dummy_unpainted_slot/'))
		const names = functions.map(f => path.basename(f, '.mcfunction')).sort()
		expect(names).toEqual(
			expect.arrayContaining([
				'dummy_blue',
				'dummy_green',
				'dummy_orange',
				'dummy_purple',
				'dummy_red',
				'dummy_unpainted',
				'dummy_yellow',
			])
		)
		const red = readAll(
			run.dataPackFolder,
			dpFiles.filter(f => f.includes('/texture_slots/dummy_unpainted_slot/'))
		)
		expect(red).toMatch(/custom_model_data"\.strings\[0\] set value "dummy_red"/)
	})

	it('Variants set slot strings instead of swapping models', () => {
		const apply = readAll(
			run.dataPackFolder,
			dpFiles.filter(f => f.includes('/variants/color1/'))
		)
		expect(apply).toMatch(/strings\[0\] set value "dummy_red"/)
		expect(apply).not.toMatch(/AJ_INTERNAL_EMPTY/)
		expect(rpFiles.some(f => f.includes('/models/blueprint/dummy/color1/'))).toBe(false)
	})

	it('summons bones with every slot default in their custom_model_data strings', () => {
		const summon = readAll(
			run.dataPackFolder,
			dpFiles.filter(f => f.endsWith('/summon.mcfunction'))
		)
		expect(summon).toMatch(/strings:\["dummy_unpainted"\]/)
	})

	it('splits slot faces into their own models with a child model per texture', () => {
		const slotModels = rpFiles.filter(f =>
			/models\/blueprint\/dummy\/[^/]+\/dummy_unpainted_slot\.json$/.test(f)
		)
		expect(slotModels.length).toBeGreaterThan(0)
		const slotModel = JSON.parse(readRp(slotModels[0]))
		expect(Object.keys(slotModel.textures)).toContain('slot_dummy_unpainted_slot')

		const redModel = JSON.parse(
			readRp(
				slotModels[0].replace(
					'dummy_unpainted_slot.json',
					'dummy_unpainted_slot/dummy_red.json'
				)
			)
		)
		expect(redModel.parent).toMatch(/dummy_unpainted_slot$/)
		expect(redModel.textures.slot_dummy_unpainted_slot).toMatch(/dummy[-_]red$/)
	})

	it('item definitions select each slot model by its custom_model_data string', () => {
		const defs = rpFiles
			.filter(f => /^assets\/[^/]+\/items\/blueprint\//.test(f))
			.map(f => JSON.parse(readRp(f)))
		const selects = defs.flatMap(def =>
			def.model.type === 'minecraft:composite' ? def.model.models : [def.model]
		)
		const slotSelect = selects.find((m: any) => m.type === 'minecraft:select')
		expect(slotSelect).toMatchObject({
			property: 'minecraft:custom_model_data',
			index: 0,
		})
		expect(slotSelect.cases.map((c: any) => c.when)).toContain('dummy_red')
		expect(slotSelect.fallback.model).toMatch(/dummy_unpainted_slot$/)
	})
})

describe('Texture Slot export (1.20.4)', () => {
	let run: ExportRun
	let dpFiles: string[]
	let rpFiles: string[]

	beforeAll(async () => {
		run = await runFixtureExport({ fixture: FIXTURE, targetVersion: '1.20.4' })
		dpFiles = relFiles(run.dataPackFolder)
		rpFiles = relFiles(run.resourcePackFolder)
	}, 180_000)

	afterAll(() => run?.cleanup())

	it('bakes a model per Variant that overrides the slot texture', () => {
		expect(run.ok).toBe(true)
		const models = rpFiles.filter(f => f.includes('/models/blueprint/dummy/color1/'))
		expect(models.length).toBeGreaterThan(0)
		const model = JSON.parse(
			fs.readFileSync(path.join(run.resourcePackFolder, models[0]), 'utf-8')
		)
		expect(model.textures.slot_dummy_unpainted_slot).toMatch(/dummy[-_]red$/)
	})

	it('has no per-slot functions', () => {
		expect(dpFiles.some(f => f.includes('/texture_slots/'))).toBe(false)
	})
})

/**
 * Bones a Variant doesn't retexture must keep (or return to) their default model. They used to be
 * swapped to the empty model, hiding them. Uses a copy of the `player` fixture where one bone's
 * cubes use a texture no Variant swaps.
 */
function writeFixtureWithUnchangedBone(dir: string) {
	const model = JSON.parse(
		fs.readFileSync(repoPath('test_blueprints/player.ajblueprint'), 'utf-8')
	)
	const groupWithCubes = (nodes: any[]): any =>
		nodes.find(
			n => typeof n === 'object' && n.children.some((c: any) => typeof c === 'string')
		) ??
		nodes
			.flatMap(n => (typeof n === 'object' ? [groupWithCubes(n.children)] : []))
			.find(Boolean)
	const cubes = new Set(
		groupWithCubes(model.outliner).children.filter((c: any) => typeof c === 'string')
	)
	for (const element of model.elements) {
		if (!cubes.has(element.uuid)) continue
		for (const face of Object.values<any>(element.faces)) face.texture = 1
	}
	const fixture = path.join(dir, 'player_unchanged_bone.ajblueprint')
	fs.writeFileSync(fixture, JSON.stringify(model))
	return fixture
}

describe.each([
	['1.21.2', /item_model" set value "animated_java:empty"/],
	['1.20.4', /CustomModelData set value 1\b/],
])('Variants keep unchanged bones visible (%s)', (targetVersion, emptyModel) => {
	let run: ExportRun
	let fixtureDir: string

	beforeAll(async () => {
		fixtureDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aj-fixture-'))
		const fixture = writeFixtureWithUnchangedBone(fixtureDir)
		run = await runFixtureExport({ fixture, targetVersion })
	}, 180_000)

	afterAll(() => {
		run?.cleanup()
		fs.rmSync(fixtureDir, { recursive: true, force: true })
	})

	it('never applies the empty model', () => {
		expect(run.ok).toBe(true)
		const files = relFiles(run.dataPackFolder).filter(f => f.includes('/variants/'))
		expect(files.length).toBeGreaterThan(0)
		expect(readAll(run.dataPackFolder, files)).not.toMatch(emptyModel)
	})
})
