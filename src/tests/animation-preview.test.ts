import { afterAll, describe, expect, it } from '@jest/globals'
import { blockbench } from '@snavesutit/jestbench'

const BLUEPRINT_FORMAT_ID = 'animated-java:format/blueprint'

/**
 * `src/animationPreview.ts` - in Animate mode, the selected animation drives which Variants and
 * slot textures the editor shows: its start state, then its variant and texture slot keyframes up
 * to the playhead, per bone. Every other mode shows the Variants panel's selection.
 *
 * Each test builds two bones, `a` and `b`, whose faces all use one slot holding red, blue and
 * green. `Blue` sets the slot to blue and excludes `b`.
 */
describe('Animation preview', () => {
	afterAll(async () => {
		await blockbench.evaluate(() => (Modes as any).options.edit.select())
	})

	it('replays keyframes per bone, variants before slots on the same frame', async () => {
		const result = await blockbench.evaluate((formatId: string) => {
			const aj = (window as any).AnimatedJava
			const g = globalThis as any
			g.newProject(g.Formats[formatId])

			const red = new Texture({ name: 'red.png' }, undefined).add(false)
			const blue = new Texture({ name: 'blue.png' }, undefined).add(false)
			const green = new Texture({ name: 'green.png' }, undefined).add(false)
			const slot = aj.textureSlots.createTextureSlot([red, blue, green])
			const bones: Record<string, Group> = {}
			for (const name of ['a', 'b']) {
				const bone = new Group({ name }).init()
				const cube = new Cube({ from: [0, 0, 0], to: [4, 4, 4] }).addTo(bone).init()
				for (const face of Object.values(cube.faces) as any[]) face.texture = slot.uuid
				bones[name] = bone
			}
			const blueVariant = new aj.Variant('Blue')
			blueVariant.slotTextures.set(slot.uuid, blue.uuid)
			blueVariant.excludedNodes.add(bones.b.uuid)
			;(bones.a as any).configs.variants[blueVariant.uuid] = { glowing: true }

			const anim = new Blockbench.Animation({ name: 'swap' }).add()
			anim.length = 2
			anim.animators.effects ??= new (g.EffectAnimator as any)(anim)
			const fx = anim.animators.effects
			// Added before the variant keyframe it shares a frame with, to check the ordering.
			fx.addKeyframe({ channel: 'texture_slot', time: 1, data_points: [{}] }).texture_slots =
				{ [slot.uuid]: green.uuid }
			fx.addKeyframe({ channel: 'variant', time: 0.5, data_points: [{}] }).variants = [
				blueVariant,
			]
			fx.addKeyframe({ channel: 'variant', time: 1, data_points: [{}] }).variants = [
				blueVariant,
			]
			fx.addKeyframe({ channel: 'variant', time: 1.5, data_points: [{}] }).variants = [
				aj.Variant.getDefault(),
			]

			const preview = aj.animationPreview
			const at = (time: number) => {
				const state = preview.computeAnimationPreviewState(anim, time)
				const textureOf = (bone: Group) =>
					[red, blue, green].find(
						t => t.uuid === state.boneSlots.get(bone.uuid)?.get(slot.uuid)
					)?.name ?? 'default'
				return { a: textureOf(bones.a), b: textureOf(bones.b) }
			}

			return {
				start: at(0),
				afterBlue: at(0.5),
				tie: at(1),
				afterDefault: at(1.5),
			}
		}, BLUEPRINT_FORMAT_ID)

		expect(result.start).toEqual({ a: 'default', b: 'default' })
		// `b` is excluded from Blue.
		expect(result.afterBlue).toEqual({ a: 'blue.png', b: 'default' })
		// Blue applies first, then the slot keyframe sets every bone.
		expect(result.tie).toEqual({ a: 'green.png', b: 'green.png' })
		// The default Variant resets every slot.
		expect(result.afterDefault).toEqual({ a: 'default', b: 'default' })
	})

	it('starts from the animation preview state', async () => {
		const result = await blockbench.evaluate((formatId: string) => {
			const aj = (window as any).AnimatedJava
			const g = globalThis as any
			g.newProject(g.Formats[formatId])

			const red = new Texture({ name: 'red.png' }, undefined).add(false)
			const blue = new Texture({ name: 'blue.png' }, undefined).add(false)
			const green = new Texture({ name: 'green.png' }, undefined).add(false)
			const slot = aj.textureSlots.createTextureSlot([red, blue, green])
			const bone = new Group({ name: 'a' }).init()
			const blueVariant = new aj.Variant('Blue')
			blueVariant.slotTextures.set(slot.uuid, blue.uuid)

			const anim = new Blockbench.Animation({ name: 'swap' }).add()
			anim.preview_variants = [blueVariant.uuid]
			const withVariant = aj.animationPreview.computeAnimationPreviewState(anim, 0)
			anim.preview_texture_slots = { [slot.uuid]: green.uuid }
			const withSlot = aj.animationPreview.computeAnimationPreviewState(anim, 0)

			return {
				blueUuid: blue.uuid,
				greenUuid: green.uuid,
				withVariant: withVariant.boneSlots.get(bone.uuid)?.get(slot.uuid),
				withVariantStack: withVariant.variants.map((v: any) => v.displayName),
				withSlot: withSlot.boneSlots.get(bone.uuid)?.get(slot.uuid),
			}
		}, BLUEPRINT_FORMAT_ID)

		expect(result.withVariant).toBe(result.blueUuid)
		expect(result.withVariantStack).toEqual(['Blue'])
		expect(result.withSlot).toBe(result.greenUuid)
	})

	it('only drives faces and display configs in Animate mode', async () => {
		const result = await blockbench.evaluate((formatId: string) => {
			const aj = (window as any).AnimatedJava
			const g = globalThis as any
			g.newProject(g.Formats[formatId])

			const red = new Texture({ name: 'red.png' }, undefined).add(false)
			const blue = new Texture({ name: 'blue.png' }, undefined).add(false)
			const slot = aj.textureSlots.createTextureSlot([red, blue])
			const bone = new Group({ name: 'a' }).init()
			const cube = new Cube({ from: [0, 0, 0], to: [4, 4, 4] }).addTo(bone).init()
			for (const face of Object.values(cube.faces) as any[]) face.texture = slot.uuid
			const blueVariant = new aj.Variant('Blue')
			blueVariant.slotTextures.set(slot.uuid, blue.uuid)
			;(bone as any).configs.variants[blueVariant.uuid] = { glowing: true }

			const anim = new Blockbench.Animation({ name: 'swap' }).add()
			anim.length = 1
			anim.animators.effects ??= new (g.EffectAnimator as any)(anim)
			anim.animators.effects.addKeyframe({
				channel: 'variant',
				time: 0.5,
				data_points: [{}],
			}).variants = [blueVariant]

			const shown = () => ({
				texture: (cube.faces.north.getTexture() as Texture)?.name,
				variant: aj.animationPreview.getPreviewVariant(bone)?.displayName,
			})

			;(Modes as any).options.animate.select()
			anim.select()
			Timeline.setTime(0)
			Animator.preview()
			const animateStart = shown()
			Timeline.setTime(0.5)
			Animator.preview()
			const animateBlue = shown()

			;(Modes as any).options.edit.select()
			const edit = shown()

			return { animateStart, animateBlue, edit }
		}, BLUEPRINT_FORMAT_ID)

		expect(result.animateStart).toEqual({ texture: 'red.png', variant: 'Default' })
		expect(result.animateBlue).toEqual({ texture: 'blue.png', variant: 'Blue' })
		// Edit mode shows the Variants panel's selection again, untouched by the animation.
		expect(result.edit).toEqual({ texture: 'red.png', variant: 'Default' })
	})
})
