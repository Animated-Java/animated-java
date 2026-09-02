import { describe, expect, it } from '@jest/globals'
import { blockbench } from '@snavesutit/jestbench'

const BLUEPRINT_FORMAT_ID = 'animated-java:format/blueprint'
const MODEL_FOLDER = 'assets/aj/models/blueprint/test'
const TEXTURE_FOLDER = 'assets/aj/textures/blueprint/test'

/**
 * The animation renderer bakes by driving Blockbench's own preview, so Molang
 * expressions in keyframe values are evaluated by Blockbench's `MolangParser`
 * and AJ just samples the resulting transforms. This checks that an expression
 * keyframe bakes to the same frames as the equivalent literal, and that the
 * `animation_variable_placeholders` text survives a codec round-trip.
 */
describe('Molang expression baking', () => {
	it('a Molang expression keyframe bakes identically to its literal value', async () => {
		const result = await blockbench.evaluate(
			(args: { formatId: string; modelFolder: string; textureFolder: string }) => {
				const aj = (window as any).AnimatedJava
				const g = globalThis as any
				g.newProject(g.Formats[args.formatId])

				const texture = new Texture({ name: 't.png' }, undefined).add(false)
				const bone = new Group({ name: 'arm' }).init()
				const cube = new Cube({ name: 'c', from: [0, 0, 0], to: [2, 2, 2] }).init()
				cube.addTo(bone)
				for (const face of Object.keys(cube.faces)) {
					cube.faces[face].texture = texture.uuid
				}

				const makeAnim = (name: string, yValue: number | string) => {
					const anim = new Blockbench.Animation({ name })
					anim.add()
					anim.length = 1
					const animator = anim.getBoneAnimator(bone)
					animator.addKeyframe({
						channel: 'rotation',
						time: 0,
						data_points: [{ x: 0, y: 0, z: 0 }],
					})
					animator.addKeyframe({
						channel: 'rotation',
						time: 1,
						data_points: [{ x: 0, y: yValue, z: 0 }],
					})
					return anim
				}

				makeAnim('literal', 45)
				makeAnim('expression', '30 + 15')

				const rig = aj.renderRig(args.modelFolder, args.textureFolder)
				return aj.renderProjectAnimations(Project, rig).then((animations: any[]) => {
					const byName = (n: string) => animations.find(a => a.name === n)
					const boneUuid = Object.keys(rig.nodes).find(
						uuid => (rig.nodes[uuid] as any).type === 'bone'
					)!
					const lastRot = (name: string) =>
						byName(name).frames.at(-1).node_transforms[boneUuid].rot
					return { literal: lastRot('literal'), expression: lastRot('expression') }
				})
			},
			{
				formatId: BLUEPRINT_FORMAT_ID,
				modelFolder: MODEL_FOLDER,
				textureFolder: TEXTURE_FOLDER,
			}
		)

		// The expression `30 + 15` must have been evaluated to 45, not left as a
		// string (which would bake to no rotation at all).
		expect(result.expression).toEqual(result.literal)
		// And it is a real, non-zero rotation.
		expect(result.literal.some((v: number) => Math.abs(v) > 1)).toBe(true)
	})

	it('animation_variable_placeholders text survives a codec round-trip', async () => {
		const roundTripped = await blockbench.evaluate((formatId: string) => {
			const aj = (window as any).AnimatedJava
			const codec = aj.BLUEPRINT_CODEC.get()
			const g = globalThis as any
			g.newProject(g.Formats[formatId])

			const placeholderText = 'my_rotation = 45;\nmy_offset = 2;'
			Interface.Panels.variable_placeholders.inside_vue.$data.text = placeholderText

			const compiled = codec.compile({ raw: true, bitmaps: false })
			g.newProject(g.Formats[formatId])
			// Clear it so a failed restore is visible.
			Interface.Panels.variable_placeholders.inside_vue.$data.text = ''
			codec.parse(compiled, 'placeholders.ajblueprint')

			return {
				compiled: compiled.animation_variable_placeholders,
				restored: Interface.Panels.variable_placeholders.inside_vue.$data.text,
			}
		}, BLUEPRINT_FORMAT_ID)

		expect(roundTripped.compiled).toBe('my_rotation = 45;\nmy_offset = 2;')
		expect(roundTripped.restored).toBe('my_rotation = 45;\nmy_offset = 2;')
	})
})
