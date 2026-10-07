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

		expect(result.focusOnly).toEqual({ unsaved: false, undoSteps: 0 })
		expect(result.typed).toEqual({ unsaved: true, undoSteps: 1 })
	})
})
