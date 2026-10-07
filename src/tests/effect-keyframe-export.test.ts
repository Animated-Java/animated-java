import { afterAll, beforeAll, describe, expect, it } from '@jest/globals'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { type ExportRun, relFiles, runFixtureExport } from './helpers/export'

/**
 * Variant and texture slot keyframes export to one `zzz/frame_effects/<frame>` function per frame
 * that changes either, which baked frames, storage mode's `apply_frame`, and looping animations'
 * `last_frame_effects` all call.
 */

/**
 * Adds a looping `effects` animation to the `Dummy` fixture: a `color1` + `color2` stack on frame
 * 0, a texture slot keyframe and a function keyframe on frame 10, and another texture slot
 * keyframe on the last frame.
 */
function addEffectKeyframes(aj: any) {
	const g = globalThis as any
	const slot = aj.textureSlots.getTextureSlots()[0]
	const textures = aj.textureSlots.getSlotTextures(slot)
	const variants = aj.Variant.all.filter((variant: any) => !variant.isDefault)

	const anim = new Blockbench.Animation({ name: 'effects', loop: 'loop' }).add()
	anim.length = 1
	anim.animators.effects ??= new g.EffectAnimator(anim)
	const fx = anim.animators.effects

	const stack = fx.addKeyframe({ channel: 'variant', time: 0, data_points: [{}] })
	stack.variants = [variants[0], variants[1]]
	stack.execute_condition = 'if entity @s[tag=stack]'

	const swap = fx.addKeyframe({ channel: 'texture_slot', time: 0.5, data_points: [{}] })
	swap.texture_slots = { [slot.uuid]: textures[3].uuid }
	swap.execute_condition = 'if entity @s[tag=swap]'

	const last = fx.addKeyframe({ channel: 'texture_slot', time: 1, data_points: [{}] })
	last.texture_slots = { [slot.uuid]: textures[1].uuid }

	const fn = fx.addKeyframe({ channel: 'function', time: 0.5, data_points: [{}] })
	fn.function = 'tag @s add gametest.function_keyframe'
	fn.execute_condition = 'if entity @s[tag=fn]'
}

function readFiles(run: ExportRun, files: string[]) {
	return files.map(f => fs.readFileSync(path.join(run.dataPackFolder, f), 'utf-8')).join('\n')
}

describe('Variant keyframe export (storage mode)', () => {
	let run: ExportRun
	let dpFiles: string[]

	// The `armor_stand` fixture's `walk` animation applies `no_armor` on frame 0.
	beforeAll(async () => {
		run = await runFixtureExport({
			fixture: 'test_blueprints/armor_stand.ajblueprint',
			settings: { use_storage_for_animation: true },
		})
		dpFiles = relFiles(run.dataPackFolder)
	}, 180_000)

	afterAll(() => run?.cleanup())

	it('exports', () => {
		expect(run.ok).toBe(true)
	})

	it('applies variants from frame storage', () => {
		const applyFrame = readFiles(
			run,
			dpFiles.filter(f => f.endsWith('/animations/walk/zzz/apply_frame.mcfunction'))
		)
		expect(applyFrame).toMatch(/\.\$\(frame\)\.effects/)
		expect(applyFrame).toMatch(/animations\/walk\/zzz\/frame_effects\/\$\(frame\)/)
		const effects = readFiles(
			run,
			dpFiles.filter(f => f.includes('/animations/walk/zzz/frame_effects/'))
		)
		expect(effects).toMatch(/variants\/no_armor\/apply/)
	})
})

describe.each([
	{ mode: 'baked', settings: {} },
	{ mode: 'storage', settings: { use_storage_for_animation: true } },
])('Effect keyframe export ($mode)', ({ mode, settings }) => {
	let run: ExportRun
	let dpFiles: string[]
	const effectFiles = () =>
		dpFiles.filter(f => f.includes('/animations/effects/zzz/frame_effects/'))

	beforeAll(async () => {
		run = await runFixtureExport({
			fixture: 'test_blueprints/Dummy.ajblueprint',
			targetVersion: '1.21.5',
			settings,
			setup: addEffectKeyframes,
		})
		dpFiles = relFiles(run.dataPackFolder)
	}, 180_000)

	afterAll(() => run?.cleanup())

	it('exports', () => {
		expect(run.ok).toBe(true)
	})

	it('applies a variant stack in order, behind one condition', () => {
		const effects = readFiles(run, effectFiles())
		expect(effects).toMatch(/execute if entity @s\[tag=stack\] run function/)
		const color1 = effects.indexOf('variants/color1/apply')
		const color2 = effects.indexOf('variants/color2/apply')
		expect(color1).toBeGreaterThan(-1)
		expect(color2).toBeGreaterThan(color1)
	})

	it('runs root function keyframes from frame effects, once, after the texture slots', () => {
		const effects = readFiles(run, effectFiles())
		expect(effects).toMatch(/execute at @s if entity @s\[tag=fn\] run function/)
		expect(effects).toContain('tag @s add gametest.function_keyframe')
		const frame10 = readFiles(
			run,
			dpFiles.filter(f => f.endsWith('/animations/effects/zzz/frame_effects/10.mcfunction'))
		)
		expect(frame10.indexOf('tag=swap')).toBeLessThan(frame10.indexOf('tag=fn'))
		const everywhere = readFiles(
			run,
			dpFiles.filter(f => f.includes('/animations/effects/'))
		)
		expect(everywhere.split('tag @s add gametest.function_keyframe').length - 1).toBe(1)
	})

	it('switches texture slots behind their condition', () => {
		const effects = readFiles(run, effectFiles())
		expect(effects).toMatch(/execute if entity @s\[tag=swap\] run function/)
		expect(effects).toMatch(/texture_slots\/dummy_unpainted_slot\/dummy_\w+/)
	})

	it('runs frame effects from each frame', () => {
		if (mode === 'baked') {
			const frame0 = readFiles(
				run,
				dpFiles.filter(f => f.endsWith('/animations/effects/zzz/frames/0.mcfunction'))
			)
			expect(frame0).toMatch(/animations\/effects\/zzz\/frame_effects\/0/)
		} else {
			const storage = readFiles(
				run,
				dpFiles.filter(f => f.includes('/animations/effects/zzz/apply_frame'))
			)
			expect(storage).toMatch(/\.\$\(frame\)\.effects/)
		}
	})

	it('runs last-frame effects when the animation loops', () => {
		// Looping skips the last frame, so its effects run from the loop patch instead.
		const file =
			mode === 'baked'
				? '/animations/effects/zzz/frames/last_frame_effects.mcfunction'
				: '/animations/effects/zzz/function_keyframe_loop_patch.mcfunction'
		const loopEffects = readFiles(
			run,
			dpFiles.filter(f => f.endsWith(file))
		)
		expect(loopEffects).toMatch(/animations\/effects\/zzz\/frame_effects\/20/)
	})
})

describe.each([
	{ mode: 'data pack', settings: {} },
	{ mode: 'plugin', settings: { enable_plugin_mode: true } },
])('Texture slot keyframes before 1.21.4 ($mode)', ({ settings }) => {
	let run: ExportRun

	beforeAll(async () => {
		run = await runFixtureExport({
			fixture: 'test_blueprints/Dummy.ajblueprint',
			targetVersion: '1.21.2',
			settings,
			setup: addEffectKeyframes,
		})
	}, 180_000)

	afterAll(() => run?.cleanup())

	it('fails to export', () => {
		expect(run.ok).toBe(false)
	})
})
