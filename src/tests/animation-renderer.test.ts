import { describe, expect, it } from '@jest/globals'
import { blockbench } from '@snavesutit/jestbench'

const BLUEPRINT_FORMAT_ID = 'animated-java:format/blueprint'

/**
 * `renderProjectAnimations` bakes Blockbench keyframes / Molang into
 * `IRenderedAnimation[]` - one sampled frame per tick. This checks the frame
 * count, the per-node transforms, that an animated channel actually changes
 * between frames, and `hashAnimations`' change detection.
 */
describe('animationRenderer.renderProjectAnimations', () => {
	it('samples a keyframed rotation into per-tick frames', async () => {
		const result = await blockbench.evaluate(async (formatId: string) => {
			const aj = (window as any).AnimatedJava
			const g = globalThis as any
			g.newProject(g.Formats[formatId])

			const texture = new Texture({ name: 't.png' }, undefined).add(false)
			const bone = new Group({ name: 'arm' }).init()
			const cube = new Cube({ name: 'c', from: [0, 0, 0], to: [2, 2, 2] }).init()
			cube.addTo(bone)
			for (const face of Object.keys(cube.faces)) cube.faces[face].texture = texture.uuid

			const animation = new Blockbench.Animation({ name: 'wave' })
			animation.add()
			animation.loop = 'loop'
			animation.length = 1

			const animator = animation.getBoneAnimator(bone)
			animator.addKeyframe({
				channel: 'rotation',
				time: 0,
				data_points: [{ x: 0, y: 0, z: 0 }],
			})
			animator.addKeyframe({
				channel: 'rotation',
				time: 1,
				data_points: [{ x: 0, y: 90, z: 0 }],
			})

			const rig = aj.renderRig(
				'assets/aj/models/blueprint/x',
				'assets/aj/textures/blueprint/x'
			)
			const animations = await aj.renderProjectAnimations(Project, rig)

			const anim = animations[0]
			const boneUuid = Object.keys(rig.nodes).find(
				uuid => (rig.nodes[uuid] as any).type === 'bone'
			)!
			const firstRot = anim.frames[0].node_transforms[boneUuid]?.rot
			const lastRot = anim.frames.at(-1).node_transforms[boneUuid]?.rot

			const hashA = aj.hashAnimations(animations)
			const hashB = aj.hashAnimations(animations)

			return {
				count: animations.length,
				name: anim.name,
				storageName: anim.storage_name,
				loopMode: anim.loop_mode,
				duration: anim.duration,
				frameCount: anim.frames.length,
				everyFrameHasBoneTransform: anim.frames.every((f: any) =>
					Array.isArray(f.node_transforms[boneUuid]?.rot)
				),
				rotChanged: JSON.stringify(firstRot) !== JSON.stringify(lastRot),
				boneIsModified: boneUuid in anim.modified_nodes,
				hashA,
				hashStable: hashA === hashB,
			}
		}, BLUEPRINT_FORMAT_ID)

		expect(result.count).toBe(1)
		expect(result.name).toBe('wave')
		expect(result.storageName).toBe('wave')
		expect(result.loopMode).toBe('loop')
		// length 1s * 20 tps + 1 = 21 frames.
		expect(result.frameCount).toBe(21)
		expect(result.duration).toBe(21)
		expect(result.everyFrameHasBoneTransform).toBe(true)
		expect(result.rotChanged).toBe(true)
		expect(result.boneIsModified).toBe(true)
		expect(typeof result.hashA).toBe('string')
		expect(result.hashStable).toBe(true)
	})

	it('returns an empty array for a project with no animations', async () => {
		const count = await blockbench.evaluate(async (formatId: string) => {
			const aj = (window as any).AnimatedJava
			const g = globalThis as any
			g.newProject(g.Formats[formatId])
			const rig = aj.renderRig(
				'assets/aj/models/blueprint/x',
				'assets/aj/textures/blueprint/x'
			)
			return (await aj.renderProjectAnimations(Project, rig)).length
		}, BLUEPRINT_FORMAT_ID)
		expect(count).toBe(0)
	})

	// The renderer only re-poses (and resets) the nodes an animation keyframes.
	// A sibling bone that the animation never touches must stay at its exact
	// rest transform in every frame - and be deduped down to its first frame.
	it('leaves bones the animation does not keyframe untouched', async () => {
		const result = await blockbench.evaluate(async (formatId: string) => {
			const aj = (window as any).AnimatedJava
			const g = globalThis as any
			g.newProject(g.Formats[formatId])

			const texture = new Texture({ name: 't.png' }, undefined).add(false)
			const moved = new Group({ name: 'moved', origin: [4, 0, 0] }).init()
			const still = new Group({ name: 'still', origin: [-4, 0, 0] }).init()
			for (const bone of [moved, still]) {
				const cube = new Cube({
					name: bone.name + '_c',
					from: [0, 0, 0],
					to: [1, 1, 1],
				}).init()
				cube.addTo(bone)
				for (const face of Object.keys(cube.faces)) cube.faces[face].texture = texture.uuid
			}

			const animation = new Blockbench.Animation({ name: 'wiggle' })
			animation.add()
			animation.loop = 'loop'
			animation.length = 1
			const animator = animation.getBoneAnimator(moved)
			animator.addKeyframe({
				channel: 'rotation',
				time: 0,
				data_points: [{ x: 0, y: 0, z: 0 }],
			})
			animator.addKeyframe({
				channel: 'rotation',
				time: 0.5,
				data_points: [{ x: 0, y: 45, z: 0 }],
			})
			animator.addKeyframe({
				channel: 'rotation',
				time: 1,
				data_points: [{ x: 0, y: 0, z: 0 }],
			})

			const rig = aj.renderRig(
				'assets/aj/models/blueprint/x',
				'assets/aj/textures/blueprint/x'
			)
			const anim = (await aj.renderProjectAnimations(Project, rig))[0]

			const idOf = (name: string) =>
				Object.keys(rig.nodes).find(uuid => (rig.nodes[uuid] as any).name === name)!
			const movedId = idOf('moved')
			const stillId = idOf('still')

			const movedFrames = anim.frames.filter((f: any) => f.node_transforms[movedId])
			const stillFrames = anim.frames.filter((f: any) => f.node_transforms[stillId])

			// The keyframed bone actually animates across the run.
			const movedRotates =
				JSON.stringify(movedFrames[0].node_transforms[movedId].rot) !==
				JSON.stringify(
					movedFrames[(movedFrames.length / 2) | 0].node_transforms[movedId].rot
				)

			return {
				frameCount: anim.frames.length,
				movedFrameCount: movedFrames.length,
				movedRotates,
				stillEmitCount: stillFrames.length,
				stillMatrix: stillFrames[0]?.node_transforms[stillId]?.matrix,
			}
		}, BLUEPRINT_FORMAT_ID)

		expect(result.frameCount).toBe(21)
		expect(result.movedRotates).toBe(true)
		// The bone with no keyframes is emitted once and deduped thereafter.
		expect(result.stillEmitCount).toBe(1)
		expect(Array.isArray(result.stillMatrix)).toBe(true)
	})
})
