import { afterAll, describe, expect, it } from '@jest/globals'
import { blockbench } from '@snavesutit/jestbench'

const BLUEPRINT_FORMAT_ID = 'animated-java:format/blueprint'

/**
 * `src/panels/customKeyframe/` - editing a variant, texture slot or function keyframe from the
 * Keyframe panel is one undo step that marks the project as unsaved. Typed fields record one step
 * per focus, like Blockbench's own keyframe inputs.
 *
 * Each test builds its project and drives the panel inline - `blockbench.evaluate` ships the
 * callback as source, so it can't close over a shared helper.
 */
describe('Keyframe panels', () => {
	afterAll(async () => {
		await blockbench.evaluate(() => (Modes as any).options.edit.select())
	})

	it('records panel edits as undo steps that mark the project unsaved', async () => {
		const result = await blockbench.evaluate(async (formatId: string) => {
			const aj = (window as any).AnimatedJava
			const g = globalThis as any
			const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))
			g.newProject(g.Formats[formatId])

			const red = new Texture({ name: 'red.png' }, undefined).add(false)
			const blue = new Texture({ name: 'blue.png' }, undefined).add(false)
			const slot = aj.textureSlots.createTextureSlot([red, blue])
			const blueVariant = new aj.Variant('Blue')
			const glowVariant = new aj.Variant('Glow')

			const anim = new Blockbench.Animation({ name: 'swap' }).add()
			anim.length = 1
			;(Modes as any).options.animate.select()
			anim.select()
			anim.animators.effects ??= new g.EffectAnimator(anim)
			const fx = anim.animators.effects
			const vkf = fx.addKeyframe({ channel: 'variant', time: 0, data_points: [{}] })
			vkf.variants = [blueVariant, glowVariant]
			const skf = fx.addKeyframe({ channel: 'texture_slot', time: 0.5, data_points: [{}] })
			skf.texture_slots = { [slot.uuid]: red.uuid }
			const fkf = fx.addKeyframe({ channel: 'function', time: 1, data_points: [{}] })

			const panel = () => Panels.keyframe.node
			// The panel mounts asynchronously after a keyframe is selected.
			const waitFor = async <T>(find: () => T | null | undefined | false): Promise<T> => {
				for (let i = 0; i < 100; i++) {
					const found = find()
					if (found) return found
					await sleep(20)
				}
				throw new Error('Timed out waiting for the keyframe panel')
			}
			const record = async (action: () => unknown) => {
				Project!.saved = true
				const index = Undo.index
				await action()
				await sleep(200)
				return { unsaved: !Project!.saved, undoSteps: Undo.index - index }
			}

			// Variant keyframe: remove `Blue`, then undo.
			fx.select()
			vkf.select()
			const variantRemoveButton = await waitFor(() =>
				panel().querySelector<HTMLElement>('li.row .in_list_button')
			)
			const variantRemove = await record(() => variantRemoveButton.click())
			const variantsAfterRemove = vkf.variants.map((v: any) => v.displayName)
			Undo.undo()
			const variantsAfterUndo = vkf.variants.map((v: any) => v.displayName)
			const rowsAfterUndo = await waitFor(
				() => panel().querySelectorAll('li.row').length === 2
			)

			// Texture slot keyframe: remove the slot.
			skf.select()
			await waitFor(() => panel().querySelector('.texture-trigger'))
			const slotRemove = await record(() =>
				panel().querySelector<HTMLElement>('.row .in_list_button')!.click()
			)
			const slotsAfterRemove = Object.keys(skf.texture_slots).length

			// Function keyframe: toggle Repeat.
			fkf.select()
			const repeatInput = await waitFor(() =>
				panel().querySelector<HTMLElement>('#repeat_input')
			)
			const repeatToggle = await record(() => repeatInput.click())

			// Duration: one step per focus, and the run summary follows it.
			const durationInput = await waitFor(() =>
				panel().querySelector<HTMLInputElement>('#repeat_duration_input')
			)
			const durationPlaceholder = durationInput.value === '' && durationInput.placeholder
			const durationEdit = await record(() => {
				durationInput.dispatchEvent(new FocusEvent('focusin', { bubbles: true }))
				durationInput.value = '10'
				durationInput.dispatchEvent(new Event('input', { bubbles: true }))
				durationInput.dispatchEvent(new FocusEvent('focusout', { bubbles: true }))
			})
			const duration = fkf.repeat_duration
			const text = (selector: string) => panel().querySelector(selector)?.textContent?.trim()
			// At tick 20 of a 20-tick animation, so 10 ticks runs past the end.
			const overrun = text('#repeat_overrun_warning')

			// A keyframe 5 ticks in cuts the 10-tick, every-tick repeat short.
			Undo.initEdit({ animations: [anim], keyframes: [] })
			fx.addKeyframe({ channel: 'function', time: 1.25, data_points: [{}] })
			anim.length = 2
			Undo.finishEdit('Add keyframe')
			const cutoff = await waitFor(() => text('#repeat_cutoff_warning'))
			const runs = text('#repeat_runs')

			// Focusing a typed field without changing it records nothing.
			const pre = panel().querySelector<HTMLElement>('.custom-bar pre')!
			const focusOnly = await record(() => {
				pre.dispatchEvent(new FocusEvent('focusin', { bubbles: true }))
				pre.dispatchEvent(new FocusEvent('focusout', { bubbles: true }))
			})

			// Changing it while focused records one step.
			const typed = await record(() => {
				pre.dispatchEvent(new FocusEvent('focusin', { bubbles: true }))
				fkf.function = 'say typed'
				pre.dispatchEvent(new FocusEvent('focusout', { bubbles: true }))
			})

			return {
				variantRemove,
				variantsAfterRemove,
				variantsAfterUndo,
				rowsAfterUndo,
				slotRemove,
				slotsAfterRemove,
				repeatToggle,
				repeat: fkf.repeat,
				durationPlaceholder,
				durationEdit,
				duration,
				overrun,
				cutoff,
				runs,
				focusOnly,
				typed,
			}
		}, BLUEPRINT_FORMAT_ID)

		expect(result.variantRemove).toEqual({ unsaved: true, undoSteps: 1 })
		expect(result.variantsAfterRemove).toEqual(['Glow'])
		expect(result.variantsAfterUndo).toEqual(['Blue', 'Glow'])
		// Undo remounts the panel with the restored keyframe.
		expect(result.rowsAfterUndo).toBe(true)

		expect(result.slotRemove).toEqual({ unsaved: true, undoSteps: 1 })
		expect(result.slotsAfterRemove).toBe(0)

		expect(result.repeatToggle).toEqual({ unsaved: true, undoSteps: 1 })
		expect(result.repeat).toBe(true)

		expect(result.durationPlaceholder).toBe('Until next keyframe')
		expect(result.durationEdit).toEqual({ unsaved: true, undoSteps: 1 })
		expect(result.duration).toBe(10)
		expect(result.overrun).toMatch(/ at 1\.$/)
		expect(result.cutoff).toMatch(/ at 1\.25\.$/)
		expect(result.runs).toBe('Runs 5 times')

		expect(result.focusOnly).toEqual({ unsaved: false, undoSteps: 0 })
		expect(result.typed).toEqual({ unsaved: true, undoSteps: 1 })
	})

	it('draws repeat bars on the timeline, with a stop where a keyframe cuts one short', async () => {
		const bars = await blockbench.evaluate(async (formatId: string) => {
			const g = globalThis as any
			const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))
			g.newProject(g.Formats[formatId])

			const anim = new Blockbench.Animation({ name: 'repeats' }).add()
			anim.length = 2
			;(Modes as any).options.animate.select()
			anim.select()
			anim.animators.effects ??= new g.EffectAnimator(anim)
			const fx = anim.animators.effects
			const repeating = (time: number, freq: number, dur: number) => {
				const kf = fx.addKeyframe({ channel: 'function', time, data_points: [{}] })
				kf.repeat = true
				kf.repeat_frequency = freq
				kf.repeat_duration = dur
				return kf
			}
			// Ticks 0, 5 and 10, then cut short by the keyframe at tick 15.
			repeating(0, 5, 20)
			// Ticks 15, 19, 23 and 27, until the next keyframe.
			repeating(0.75, 4, 0)
			// A plain keyframe at tick 30 draws no bar.
			fx.addKeyframe({ channel: 'function', time: 1.5, data_points: [{}] })
			fx.select()
			Timeline.vue.$forceUpdate()
			await sleep(200)

			// Pixels per tick, so the test doesn't depend on the timeline's zoom.
			const tick = (Timeline.vue.size as number) / 20
			return [...document.querySelectorAll('#panel_timeline .aj_repeat_bar')].map(bar => ({
				// How far short of its last tick the bar stops, in pixels.
				gap: Math.round(15 * tick - Number(bar.getAttribute('width'))),
				marks: bar.querySelectorAll('.aj_repeat_mark').length,
				cut: !!bar.querySelector('.aj_repeat_cut'),
			}))
		}, BLUEPRINT_FORMAT_ID)

		expect(bars).toEqual([
			// Stops short of the keyframe at tick 15, so the stop clears its icon.
			{ gap: 7, marks: 2, cut: true },
			{ gap: 0, marks: 3, cut: false },
		])
	})
})
