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

	// Blockbench solves IK in a pass after every node's `displayFrame`, and an IK chain moves
	// bones the animation never keyframes. Both have to make it into the export.
	it("exports IK chains as Blockbench's preview poses them", async () => {
		const result = await blockbench.evaluate(async (formatId: string) => {
			const aj = (window as any).AnimatedJava
			const g = globalThis as any
			g.newProject(g.Formats[formatId])

			const body = new Group({ name: 'body', origin: [0, 16, 0] }).init()
			const shoulder = new Group({ name: 'shoulder', origin: [0, 16, 0] }).addTo(body).init()
			const upper = new Group({ name: 'upper', origin: [0, 8, 0] }).addTo(shoulder).init()
			const hand = new Locator({ name: 'hand', position: [0, 0, 0] }).addTo(upper).init()
			const ik = new NullObject({ name: 'ik', position: [4, 4, 4], ik_target: hand.uuid })
			ik.init()
			ik.ik_source = shoulder.uuid

			const animation = new Blockbench.Animation({ name: 'reach' })
			animation.add()
			animation.loop = 'loop'
			animation.length = 1
			const animator = animation.getBoneAnimator(ik)
			animator.addKeyframe({
				channel: 'position',
				time: 0,
				data_points: [{ x: 0, y: 0, z: 0 }],
			})
			animator.addKeyframe({
				channel: 'position',
				time: 1,
				data_points: [{ x: -8, y: 4, z: -4 }],
			})

			const rig = aj.renderRig(
				'assets/aj/models/blueprint/x',
				'assets/aj/textures/blueprint/x'
			)
			const [rendered] = await aj.renderProjectAnimations(Project, rig)

			/** A node's exported world rotation at `tick`: its latest emitted frame. */
			const exportedRotation = (uuid: string, tick: number) => {
				const frame = rendered.frames
					.slice(0, tick + 1)
					.findLast((f: any) => f.node_transforms[uuid])
				const matrix = new THREE.Matrix4().fromArray(frame.node_transforms[uuid].matrix)
				const rotation = new THREE.Quaternion()
				matrix.decompose(new THREE.Vector3(), rotation, new THREE.Vector3())
				return rotation
			}
			/** Rotation relative to the parent; immune to the export's scene correction. */
			const exportedLocal = (node: Group, parent: Group, tick: number) =>
				exportedRotation(parent.uuid, tick)
					.invert()
					.multiply(exportedRotation(node.uuid, tick))

			const errors: number[] = []
			animation.select()
			for (const tick of [0, 5, 10, 20]) {
				Timeline.setTime(tick / 20)
				Animator.preview()
				for (const [node, parent] of [
					[shoulder, body],
					[upper, shoulder],
				]) {
					errors.push(exportedLocal(node, parent, tick).angleTo(node.mesh.quaternion))
				}
			}

			// The default pose renders an empty animation, so it has to match Blockbench's
			// preview of one, IK pass included.
			const restRig = aj.renderRig(
				'assets/aj/models/blueprint/x',
				'assets/aj/textures/blueprint/x'
			)
			const defaultRotation = (uuid: string) => {
				const matrix = new THREE.Matrix4().fromArray(
					restRig.nodes[uuid].default_transform.matrix
				)
				const rotation = new THREE.Quaternion()
				matrix.decompose(new THREE.Vector3(), rotation, new THREE.Vector3())
				return rotation
			}
			const exportedRest = defaultRotation(shoulder.uuid)
				.invert()
				.multiply(defaultRotation(upper.uuid))
			const empty = new Blockbench.Animation({ name: 'empty' })
			empty.add()
			empty.select()
			Timeline.setTime(0)
			Animator.preview()
			const restError = exportedRest.angleTo(upper.mesh.quaternion)

			return {
				maxError: Math.max(...errors),
				upperFrames: rendered.frames.filter((f: any) => f.node_transforms[upper.uuid])
					.length,
				restError,
			}
		}, BLUEPRINT_FORMAT_ID)

		// IK ran: the unkeyframed chain bone moved on most ticks, not just the first.
		expect(result.upperFrames).toBeGreaterThan(10)
		expect(result.maxError).toBeLessThan(1e-4)
		expect(result.restError).toBeLessThan(1e-4)
	})
})
