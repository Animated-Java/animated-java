import { describe, expect, it } from '@jest/globals'
import { blockbench } from '@snavesutit/jestbench'

const BLUEPRINT_FORMAT_ID = 'animated-java:format/blueprint'
const MODEL_FOLDER = 'assets/aj/models/blueprint/test'
const TEXTURE_FOLDER = 'assets/aj/textures/blueprint/test'

/**
 * `src/mods/customKeyframes.ts` reshapes Blockbench's `EffectAnimator` on
 * Blueprint projects: it drops the stock effect channels (keeping `sound`),
 * adds `variant`, `texture_slot` and `function` channels, and hangs typed accessors off
 * `Keyframe` (`.variants`, `.texture_slots`, `.function`, `.execute_condition`, `.repeat`,
 * `.repeat_frequency`). The animation renderer then turns those into
 * `IRenderedFrame.variants` / `.texture_slots` / `.function`.
 *
 * Each test creates its own effects animator inline - `blockbench.evaluate`
 * ships the callback as source, so it can't close over a module-level helper.
 */
describe('AJ custom keyframes', () => {
	it('reconfigures the EffectAnimator channels on a Blueprint project', async () => {
		const channels = await blockbench.evaluate((formatId: string) => {
			const g = globalThis as any
			g.newProject(g.Formats[formatId])
			return Object.keys((g.EffectAnimator.prototype as any).channels)
		}, BLUEPRINT_FORMAT_ID)

		expect(channels).toEqual(
			expect.arrayContaining(['sound', 'variant', 'texture_slot', 'function'])
		)
		expect(channels).not.toContain('particle')
		expect(channels).not.toContain('timeline')
	})

	it('exposes typed accessors on variant, texture slot and function keyframes', async () => {
		const result = await blockbench.evaluate((formatId: string) => {
			const g = globalThis as any
			g.newProject(g.Formats[formatId])
			const aj = (window as any).AnimatedJava

			const anim = new Blockbench.Animation({ name: 'fx' })
			anim.add()
			anim.length = 1
			anim.animators.effects ??= new (g.EffectAnimator as any)(anim)
			const fx = anim.animators.effects

			const red = new aj.Variant('Red')
			const glow = new aj.Variant('Glow')

			const vkf = fx.addKeyframe({ channel: 'variant', time: 0, data_points: [{}] })
			const defaultVariants = vkf.variants.map((v: any) => v.uuid)
			vkf.variants = [red, glow]

			const skf = fx.addKeyframe({ channel: 'texture_slot', time: 0, data_points: [{}] })
			const defaultTextureSlots = skf.texture_slots
			skf.texture_slots = { slot: 'texture' }

			const fkf = fx.addKeyframe({ channel: 'function', time: 0.5, data_points: [{}] })
			fkf.function = 'say hello'
			fkf.execute_condition = 'if score @s x matches 1'
			fkf.repeat = true
			fkf.repeat_frequency = 4

			return {
				defaultVariants,
				defaultUuid: aj.Variant.getDefault().uuid,
				variantsResolved: vkf.variants.map((v: any) => v.uuid),
				variantsStored: vkf.data_points[0].variants,
				expectedVariants: [red.uuid, glow.uuid],
				defaultTextureSlots,
				textureSlotsStored: skf.data_points[0].texture_slots,
				fn: fkf.function,
				cond: fkf.execute_condition,
				repeat: fkf.repeat,
				freq: fkf.repeat_frequency,
				channels: [vkf.channel, skf.channel, fkf.channel],
			}
		}, BLUEPRINT_FORMAT_ID)

		expect(result.defaultVariants).toEqual([result.defaultUuid])
		expect(result.variantsResolved).toEqual(result.expectedVariants)
		expect(result.variantsStored).toEqual(result.expectedVariants)
		expect(result.defaultTextureSlots).toEqual({})
		expect(result.textureSlotsStored).toEqual({ slot: 'texture' })
		expect(result.fn).toBe('say hello')
		expect(result.cond).toBe('if score @s x matches 1')
		expect(result.repeat).toBe(true)
		expect(result.freq).toBe(4)
		expect(result.channels).toEqual(['variant', 'texture_slot', 'function'])
	})

	it('the animation renderer turns them into frame variants / texture slots / functions', async () => {
		const result = await blockbench.evaluate(
			(args: { formatId: string; modelFolder: string; textureFolder: string }) => {
				const g = globalThis as any
				g.newProject(g.Formats[args.formatId])
				const aj = (window as any).AnimatedJava

				const texture = new Texture({ name: 't.png' }, undefined).add(false)
				const bone = new Group({ name: 'bone' }).init()
				const cube = new Cube({ name: 'c', from: [0, 0, 0], to: [2, 2, 2] }).init()
				cube.addTo(bone)
				for (const face of Object.keys(cube.faces)) {
					cube.faces[face].texture = texture.uuid
				}

				const red = new aj.Variant('Red')
				const glow = new aj.Variant('Glow')

				const anim = new Blockbench.Animation({ name: 'fx' })
				anim.add()
				anim.length = 1
				anim.animators.effects ??= new (g.EffectAnimator as any)(anim)
				const fx = anim.animators.effects

				const vkf = fx.addKeyframe({ channel: 'variant', time: 0, data_points: [{}] })
				vkf.variants = [red, glow]
				vkf.execute_condition = ' if entity @s '
				const skf = fx.addKeyframe({ channel: 'texture_slot', time: 0, data_points: [{}] })
				skf.texture_slots = { slot: texture.uuid }
				const emptySkf = fx.addKeyframe({
					channel: 'texture_slot',
					time: 0.5,
					data_points: [{}],
				})
				emptySkf.texture_slots = {}
				const fkf = fx.addKeyframe({ channel: 'function', time: 0, data_points: [{}] })
				fkf.function = 'say tick zero'

				const rig = aj.renderRig(args.modelFolder, args.textureFolder)
				return aj.renderProjectAnimations(Project, rig).then((animations: any[]) => {
					const frame0 = animations[0].frames[0]
					const frame10 = animations[0].frames[10]
					return {
						expectedVariants: [red.uuid, glow.uuid],
						textureUuid: texture.uuid,
						frame0Variants: frame0.variants,
						frame0VariantsCondition: frame0.variants_execute_condition,
						frame0TextureSlots: frame0.texture_slots,
						frame0Function: frame0.function,
						frame10HasTextureSlots: 'texture_slots' in frame10,
					}
				})
			},
			{
				formatId: BLUEPRINT_FORMAT_ID,
				modelFolder: MODEL_FOLDER,
				textureFolder: TEXTURE_FOLDER,
			}
		)

		expect(result.frame0Variants).toEqual(result.expectedVariants)
		expect(result.frame0VariantsCondition).toBe('if entity @s')
		expect(result.frame0TextureSlots).toEqual({ slot: result.textureUuid })
		expect(result.frame0Function).toBe('say tick zero')
		// An empty texture slot keyframe changes nothing, so it isn't rendered.
		expect(result.frame10HasTextureSlots).toBe(false)
	})

	it('survive a codec compile → parse round-trip', async () => {
		const result = await blockbench.evaluate((formatId: string) => {
			const g = globalThis as any
			g.newProject(g.Formats[formatId])
			const aj = (window as any).AnimatedJava
			const codec = aj.BLUEPRINT_CODEC.get()

			const red = new aj.Variant('Red')

			const anim = new Blockbench.Animation({ name: 'fx' })
			anim.add()
			anim.length = 1
			anim.animators.effects ??= new (g.EffectAnimator as any)(anim)
			const fx = anim.animators.effects

			const vkf = fx.addKeyframe({ channel: 'variant', time: 0, data_points: [{}] })
			vkf.variants = [red, aj.Variant.getDefault()]
			const skf = fx.addKeyframe({ channel: 'texture_slot', time: 0, data_points: [{}] })
			skf.texture_slots = { slot: 'texture' }
			anim.preview_variants = [red.uuid]
			anim.preview_texture_slots = { slot: 'texture' }
			const fkf = fx.addKeyframe({ channel: 'function', time: 0.5, data_points: [{}] })
			fkf.function = 'say persisted'
			fkf.repeat = true

			const expectedVariants = [red.uuid, aj.Variant.getDefault().uuid]
			const compiled = codec.compile({ raw: true, bitmaps: false })
			g.newProject(g.Formats[formatId])
			codec.parse(compiled, 'kf.ajblueprint')

			const animation = Blockbench.Animation.all[0] as any
			const rtFx = animation?.animators?.effects
			const variantKf = (rtFx?.variant ?? []).at(0)
			const textureSlotKf = (rtFx?.texture_slot ?? []).at(0)
			const functionKf = (rtFx?.function ?? []).at(0)

			return {
				hasEffectsAnimator: !!rtFx,
				variants: variantKf?.data_points?.[0]?.variants,
				expectedVariants,
				textureSlots: textureSlotKf?.data_points?.[0]?.texture_slots,
				previewVariants: animation.preview_variants,
				expectedPreviewVariants: [expectedVariants[0]],
				previewTextureSlots: animation.preview_texture_slots,
				functionText: functionKf?.data_points?.[0]?.function,
				functionRepeat: functionKf?.data_points?.[0]?.repeat,
			}
		}, BLUEPRINT_FORMAT_ID)

		expect(result.hasEffectsAnimator).toBe(true)
		expect(result.variants).toEqual(result.expectedVariants)
		expect(result.textureSlots).toEqual({ slot: 'texture' })
		expect(result.previewVariants).toEqual(result.expectedPreviewVariants)
		expect(result.previewTextureSlots).toEqual({ slot: 'texture' })
		expect(result.functionText).toBe('say persisted')
		expect(result.functionRepeat).toBe(true)
	})
})
