import { describe, expect, it } from '@jest/globals'
import { blockbench } from '@snavesutit/jestbench'

const BLUEPRINT_FORMAT_ID = 'animated-java:format/blueprint'
const MODEL_FOLDER = 'assets/aj/models/blueprint/test'
const TEXTURE_FOLDER = 'assets/aj/textures/blueprint/test'

/**
 * `src/mods/customKeyframes.ts` reshapes Blockbench's `EffectAnimator` on
 * Blueprint projects: it drops the stock effect channels (keeping `sound`),
 * adds `variant` and `function` channels, and hangs typed accessors off
 * `Keyframe` (`.variant`, `.function`, `.execute_condition`, `.repeat`,
 * `.repeat_frequency`). The animation renderer then turns those into
 * `IRenderedFrame.variants` / `.function`.
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

		expect(channels).toEqual(expect.arrayContaining(['sound', 'variant', 'function']))
		expect(channels).not.toContain('particle')
		expect(channels).not.toContain('timeline')
	})

	it('exposes typed accessors on variant and function keyframes', async () => {
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

			const vkf = fx.addKeyframe({ channel: 'variant', time: 0, data_points: [{}] })
			vkf.variant = red

			const fkf = fx.addKeyframe({ channel: 'function', time: 0.5, data_points: [{}] })
			fkf.function = 'say hello'
			fkf.execute_condition = 'if score @s x matches 1'
			fkf.repeat = true
			fkf.repeat_frequency = 4

			return {
				variantResolved: vkf.variant?.uuid === red.uuid,
				variantStoredUuid: vkf.data_points[0].variant === red.uuid,
				fn: fkf.function,
				cond: fkf.execute_condition,
				repeat: fkf.repeat,
				freq: fkf.repeat_frequency,
				channels: [vkf.channel, fkf.channel],
			}
		}, BLUEPRINT_FORMAT_ID)

		expect(result.variantResolved).toBe(true)
		expect(result.variantStoredUuid).toBe(true)
		expect(result.fn).toBe('say hello')
		expect(result.cond).toBe('if score @s x matches 1')
		expect(result.repeat).toBe(true)
		expect(result.freq).toBe(4)
		expect(result.channels).toEqual(['variant', 'function'])
	})

	it('the animation renderer turns them into frame variants / functions', async () => {
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

				const anim = new Blockbench.Animation({ name: 'fx' })
				anim.add()
				anim.length = 1
				anim.animators.effects ??= new (g.EffectAnimator as any)(anim)
				const fx = anim.animators.effects

				const vkf = fx.addKeyframe({ channel: 'variant', time: 0, data_points: [{}] })
				vkf.variant = red
				const fkf = fx.addKeyframe({ channel: 'function', time: 0, data_points: [{}] })
				fkf.function = 'say tick zero'

				const rig = aj.renderRig(args.modelFolder, args.textureFolder)
				return aj.renderProjectAnimations(Project, rig).then((animations: any[]) => {
					const frame0 = animations[0].frames[0]
					return {
						redUuid: red.uuid,
						frame0Variants: frame0.variants,
						frame0Function: frame0.function,
					}
				})
			},
			{
				formatId: BLUEPRINT_FORMAT_ID,
				modelFolder: MODEL_FOLDER,
				textureFolder: TEXTURE_FOLDER,
			}
		)

		expect(result.frame0Variants).toEqual([result.redUuid])
		expect(result.frame0Function).toBe('say tick zero')
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
			vkf.variant = red
			const fkf = fx.addKeyframe({ channel: 'function', time: 0.5, data_points: [{}] })
			fkf.function = 'say persisted'
			fkf.repeat = true

			const redUuid = red.uuid
			const compiled = codec.compile({ raw: true, bitmaps: false })
			g.newProject(g.Formats[formatId])
			codec.parse(compiled, 'kf.ajblueprint')

			const animation = Blockbench.Animation.all[0] as any
			const rtFx = animation?.animators?.effects
			const variantKf = (rtFx?.variant ?? []).at(0)
			const functionKf = (rtFx?.function ?? []).at(0)

			return {
				hasEffectsAnimator: !!rtFx,
				variantUuid: variantKf?.data_points?.[0]?.variant,
				expectedVariantUuid: redUuid,
				functionText: functionKf?.data_points?.[0]?.function,
				functionRepeat: functionKf?.data_points?.[0]?.repeat,
			}
		}, BLUEPRINT_FORMAT_ID)

		expect(result.hasEffectsAnimator).toBe(true)
		expect(result.variantUuid).toBe(result.expectedVariantUuid)
		expect(result.functionText).toBe('say persisted')
		expect(result.functionRepeat).toBe(true)
	})
})
