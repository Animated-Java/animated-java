import * as crypto from 'node:crypto'
import {
	PROGRESS,
	PROGRESS_DETAIL,
	setExportProgressPhase,
	SUB_MAX_PROGRESS,
	SUB_PROGRESS,
} from '../dialogs/exportProgress/exportProgress'
import { BONE_INTERPOLATION_ENABLED } from '../mods/boneAnimatorMod'
import { Interaction } from '../outliner/interaction'
import { TextDisplay } from '../outliner/textDisplay'
import { VanillaBlockDisplay } from '../outliner/vanillaBlockDisplay'
import { VanillaItemDisplay } from '../outliner/vanillaItemDisplay'
import { sanitizeStorageKey } from '../util/minecraftUtil'
import { scrubUndefined } from '../util/misc'
import { MSLimiter } from '../util/msLimiter'
import type { AnyRenderedNode, IRenderedRig } from './rigRenderer'

const RAD_TO_DEG = 180 / Math.PI
/** Ticks (frames) per second. Animations are sampled once per Minecraft tick. */
const TICK_RATE = 20
/** Applied to {@link TextDisplay} matrices so text faces the same way it does in-game. */
const TEXT_DISPLAY_ROTATION_MATRIX = new THREE.Matrix4().makeRotationFromEuler(
	new THREE.Euler(0, Math.PI, 0, 'XYZ')
)
const MATRIX_POSITION_SCRATCH = new THREE.Vector3()
const MATRIX_SCALE_SCRATCH = new THREE.Vector3()
/**
 * Node types that skip re-emitting a frame when their matrix is unchanged, so a
 * subtree of them with no keyframed ancestor only needs sampling on tick 0.
 * (`locator` / `interaction` are excluded - they emit a transform every tick.)
 */
const SKIPPABLE_NODE_TYPES = new Set([
	'bone',
	'text_display',
	'item_display',
	'block_display',
	'null_object',
	'camera',
	'struct',
])

function getMainPreview() {
	return Preview.all.find(p => p.id === 'main')
}

export function correctSceneAngle() {
	getMainPreview()?.controls.rotateLeft(Math.PI)
	Canvas.scene.setRotationFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI)
}

export function restoreSceneAngle() {
	getMainPreview()?.controls.rotateLeft(-Math.PI)
	Canvas.scene.setRotationFromAxisAngle(new THREE.Vector3(0, 1, 0), 0)
}

function getNodeMatrix(node: OutlinerElement, scale: number, out?: THREE.Matrix4) {
	const matrixWorld = out ? out.copy(node.mesh.matrixWorld) : node.mesh.matrixWorld.clone()
	MATRIX_POSITION_SCRATCH.setFromMatrixPosition(matrixWorld).multiplyScalar(1 / 16)
	matrixWorld.setPosition(MATRIX_POSITION_SCRATCH)
	matrixWorld.scale(MATRIX_SCALE_SCRATCH.setScalar(scale))

	if (node instanceof TextDisplay) {
		matrixWorld.multiply(TEXT_DISPLAY_ROTATION_MATRIX)
	}

	return matrixWorld
}

/** Exact equality check for two flat 16-element matrix buffers. */
function matrixElementsEqual(a: ArrayLike<number> | undefined, b: ArrayLike<number> | undefined) {
	if (!a || !b) return false
	for (let i = 0; i < 16; i++) {
		if (a[i] !== b[i]) return false
	}
	return true
}

export interface INodeTransform {
	/**
	 * Flat, column-major transformation matrix (16 elements) - the `elements` of
	 * what used to be a `THREE.Matrix4`, kept as a plain array to drop the wrapper
	 * object. Optional only because {@link IRenderedNode.default_transform} is
	 * built up in two steps.
	 */
	matrix?: number[]
	decomposed?: {
		translation: ArrayVector3
		left_rotation: ArrayVector4
		scale: ArrayVector3
	}
	pos: ArrayVector3
	rot: ArrayVector3
	scale: ArrayVector3
	/** The two-axis (entity head) rotation of the node. Always equal to `[rot[0], rot[1]]`. */
	head_rot: ArrayVector2
	interpolation?: 'step' | 'pre-post'

	function?: string
	function_execute_condition?: string
}

export interface IRenderedFrame {
	time: number
	node_transforms: Record<string, INodeTransform>
	/** A list of Variants (by UUID) to apply this frame */
	variants?: string[]
	/** The condition to check before applying variants */
	variants_execute_condition?: string
	/** A mcfunction to run as the root on this frame. (Supports MCB syntax) */
	function?: string
	/** The condition to check before running the function */
	function_execute_condition?: string
}

export interface IRenderedAnimation {
	name: string
	/** A sanitized version of {@link IRenderedAnimation.name} that is safe to use as a key in a storage object. */
	storage_name: string
	uuid: string
	loop_delay: number
	frames: IRenderedFrame[]
	/**
	 * Duration of the animation in ticks (AKA frames). Same as animation.frames.length
	 */
	duration: number
	loop_mode: 'loop' | 'once' | 'hold'
	/**
	 * Nodes that were modified by the animation
	 */
	modified_nodes: Record<string, AnyRenderedNode>
}

interface LastFrameCacheItem {
	/** Flat 16-element matrix of the last emitted frame, for exact change detection. */
	matrix: number[]
	keyframe?: _Keyframe
}

/**
 * Samples one animation into {@link IRenderedFrame}s.
 *
 * A fresh instance is created per animation render pass. Every per-animation
 * lookup table (keyframes by tick, outliner node references, parent chains, ...)
 * lives on the instance and is freed with it, so nothing leaks between
 * animations and the sampler is safe to use re-entrantly.
 */
export class AnimationSampler {
	private readonly animation: _Animation
	private readonly nodeEntries: Array<[string, AnyRenderedNode]>
	private readonly enablePluginMode: boolean

	private readonly outlinerNodes = new Map<string, OutlinerElement>()
	private readonly excludedNodes: Set<string>
	/** Node UUID -> (tick -> keyframe at that tick) */
	private readonly keyframesByNode = new Map<string, Map<number, _Keyframe>>()
	/** Node UUID -> ancestor UUIDs, nearest first, `root` excluded. */
	private readonly parentChains = new Map<string, string[]>()
	private readonly variantKeyframesByTick = new Map<number, _Keyframe>()
	private readonly functionKeyframesByTick = new Map<number, _Keyframe>()
	private readonly lastFrameCache = new Map<string, LastFrameCacheItem>()

	/**
	 * Entries whose transform can never change after the first frame - no
	 * keyframed ancestor or self - so they only need sampling on tick 0. Only
	 * covers node types that already skip unchanged frames (bone / display /
	 * null_object / camera / struct); locators and interactions always emit.
	 */
	private readonly dynamicEntries: Array<[string, AnyRenderedNode]>
	/** Nodes this animation keyframes + their animators, ancestors-first. */
	readonly poseTargets: Array<{ node: OutlinerElement; animator: BoneAnimator }>
	/**
	 * Flat, ancestors-first list of rig-node meshes under an animated root - the
	 * ones whose `matrixWorld` a moving parent invalidates each tick. Built once;
	 * see the constructor.
	 */
	readonly worldRefreshMeshes: THREE.Object3D[]
	/**
	 * Tick -> the bone/display nodes whose previous-tick keyframe carries two
	 * data points, i.e. need re-sampling a hair later for the pre-post
	 * discontinuity. Lets {@link sample} do one shared preview excursion per
	 * tick instead of two per affected node.
	 */
	private readonly prePostByTick = new Map<
		number,
		Array<{ uuid: string; scale: number; node: OutlinerElement }>
	>()
	private readonly prePostMatrices = new Map<string, THREE.Matrix4>()

	private readonly posScratch = new THREE.Vector3()
	private readonly quatScratch = new THREE.Quaternion()
	private readonly scaleScratch = new THREE.Vector3()
	private readonly eulerScratch = new THREE.Euler()
	private readonly matrixScratch = new THREE.Matrix4()

	constructor(
		animation: _Animation,
		nodeMap: IRenderedRig['nodes'],
		animatableNodes: OutlinerElement[]
	) {
		this.animation = animation
		this.nodeEntries = Object.entries(nodeMap)
		this.enablePluginMode = !!Project?.animated_java.enable_plugin_mode

		for (const node of animatableNodes) {
			this.outlinerNodes.set(node.uuid, node)
		}

		this.excludedNodes = new Set(
			animation.excluded_nodes ? animation.excluded_nodes.map(b => b.value) : []
		)

		for (const uuid of Object.keys(nodeMap)) {
			const animator: GeneralAnimator | undefined = animation.animators[uuid]
			const byTick = new Map<number, _Keyframe>()
			if (animator?.keyframes) {
				for (const kf of animator.keyframes) {
					byTick.set(Math.round(kf.time * TICK_RATE), kf)
				}
			}
			this.keyframesByNode.set(uuid, byTick)

			const chain: string[] = []
			let parent = nodeMap[uuid]?.parent
			while (parent && parent !== 'root') {
				chain.push(parent)
				parent = nodeMap[parent]?.parent
			}
			this.parentChains.set(uuid, chain)
		}

		const effects = animation.animators.effects
		for (const kf of (effects?.variant as _Keyframe[] | undefined) ?? []) {
			this.variantKeyframesByTick.set(Math.round(kf.time * TICK_RATE), kf)
		}
		for (const kf of (effects?.function as _Keyframe[] | undefined) ?? []) {
			this.functionKeyframesByTick.set(Math.round(kf.time * TICK_RATE), kf)
		}

		this.dynamicEntries = this.nodeEntries.filter(([uuid, node]) =>
			this.isDynamicEntry(uuid, node)
		)
		this.buildPrePostIndex()

		// The nodes this animation actually keyframes, paired with their resolved
		// animator and ordered ancestors-first. Posing only these is equivalent
		// to posing the whole rig: a node with no keyframes contributes nothing
		// in `displayFrame`, and parent-driven motion still flows through the
		// world-matrix sweep below. (The warm-up pass in `renderAnimation` has
		// already resolved every animator, so `getBoneAnimator` is a cache hit.)
		this.poseTargets = animatableNodes
			.filter(node => (this.keyframesByNode.get(node.uuid)?.size ?? 0) > 0)
			.sort(
				(a, b) =>
					(this.parentChains.get(a.uuid)?.length ?? 0) -
					(this.parentChains.get(b.uuid)?.length ?? 0)
			)
			.map(node => ({ node, animator: animation.getBoneAnimator(node)! }))
			.filter(t => !!t.animator)

		// Flat, ancestors-first list of the rig-node meshes sitting under an
		// animated root - exactly the ones whose `matrixWorld` a moving parent
		// invalidates each tick. Cube and helper leaves are excluded: nothing
		// samples them and they have no sampled descendants. Each mesh's parent
		// is either `model_3d`, an earlier entry, or a never-moving static
		// ancestor, so a single parent-first `multiplyMatrices` sweep is exact.
		this.worldRefreshMeshes = this.nodeEntries
			.filter(([uuid]) => this.hasKeyframedSelfOrAncestor(uuid))
			.sort(
				(a, b) =>
					(this.parentChains.get(a[0])?.length ?? 0) -
					(this.parentChains.get(b[0])?.length ?? 0)
			)
			.map(([uuid]) => this.outlinerNodes.get(uuid)?.mesh)
			.filter((mesh): mesh is THREE.Object3D => !!mesh)
	}

	/** True if this node or any ancestor is keyframed by this animation. */
	private hasKeyframedSelfOrAncestor(uuid: string): boolean {
		if ((this.keyframesByNode.get(uuid)?.size ?? 0) > 0) return true
		for (const ancestorUuid of this.parentChains.get(uuid) ?? []) {
			if ((this.keyframesByNode.get(ancestorUuid)?.size ?? 0) > 0) return true
		}
		return false
	}

	private isDynamicEntry(uuid: string, node: AnyRenderedNode): boolean {
		if (!SKIPPABLE_NODE_TYPES.has(node.type)) return true
		return this.hasKeyframedSelfOrAncestor(uuid)
	}

	/**
	 * Index, per tick, the bone/display nodes whose previous-tick keyframe has
	 * two data points. {@link sample} resamples all of them in one preview
	 * excursion rather than nudging the timeline twice per node.
	 */
	private buildPrePostIndex() {
		const prePostTypes = new Set(['bone', 'text_display', 'item_display', 'block_display'])
		for (const [uuid, node] of this.nodeEntries) {
			if (!prePostTypes.has(node.type)) continue
			const outlinerNode = this.outlinerNodes.get(uuid)
			if (!outlinerNode) continue
			if (this.excludedNodes.has(uuid)) continue
			const keyframes = this.keyframesByNode.get(uuid)
			if (!keyframes) continue
			for (const [kfTick, kf] of keyframes) {
				if (kf.data_points.length !== 2) continue
				const tick = kfTick + 1
				let list = this.prePostByTick.get(tick)
				if (!list) this.prePostByTick.set(tick, (list = []))
				list.push({
					uuid,
					scale: (node as { base_scale: number }).base_scale,
					node: outlinerNode,
				})
			}
		}
	}

	private getVariantFrame(
		tick: number
	): Pick<IRenderedFrame, 'variants' | 'variants_execute_condition'> {
		const kf = this.variantKeyframesByTick.get(tick)
		// REVIEW - Variant keyframes do not support multiple variants yet.
		const variant = kf?.variant?.uuid
		if (!variant) return {}
		return scrubUndefined({
			variants: [variant],
			variants_execute_condition: kf!.execute_condition?.trim(),
		})
	}

	private getFunctionFrame(
		tick: number
	): Pick<IRenderedFrame, 'function' | 'function_execute_condition'> {
		const kf = this.functionKeyframesByTick.get(tick)
		if (!kf) return {}
		return scrubUndefined({
			function: kf.function?.trim(),
			function_execute_condition: kf.execute_condition?.trim(),
		})
	}

	/** Inherit instant/pre-post interpolation from the nearest keyframed ancestor. */
	private inheritedInterpolation(uuid: string, tick: number): INodeTransform['interpolation'] {
		for (const ancestorUuid of this.parentChains.get(uuid) ?? []) {
			const ancestorKeyframes = this.keyframesByNode.get(ancestorUuid)
			const ancestorKeyframe = ancestorKeyframes?.get(tick)
			const prevAncestorKeyframe = ancestorKeyframes?.get(tick - 1)
			if (ancestorKeyframe?.interpolation === 'step') return 'step'
			if (prevAncestorKeyframe?.data_points.length === 2) return 'pre-post'
			// This ancestor moved with normal interpolation; nothing to inherit.
			if (ancestorKeyframe) return undefined
		}
		return undefined
	}

	/** Record the last emitted matrix for a node, reusing the cached buffer. */
	private storeLastFrame(uuid: string, elements: ArrayLike<number>, keyframe?: _Keyframe) {
		const existing = this.lastFrameCache.get(uuid)
		if (existing) {
			for (let i = 0; i < 16; i++) existing.matrix[i] = elements[i]
			existing.keyframe = keyframe
		} else {
			this.lastFrameCache.set(uuid, {
				matrix: Array.prototype.slice.call(elements),
				keyframe,
			})
		}
	}

	sample(tick: number): IRenderedFrame {
		const { animation } = this
		const time = tick / TICK_RATE

		const frame: IRenderedFrame = {
			time,
			node_transforms: {},
			...this.getVariantFrame(tick),
			...this.getFunctionFrame(tick),
		}

		// One shared preview excursion for every pre-post node at this tick,
		// instead of nudging the timeline back and forth per node.
		const prePostNodes = this.prePostByTick.get(tick)
		this.prePostMatrices.clear()
		if (prePostNodes) {
			updatePreviewFast(animation, time + 0.001, this.poseTargets, this.worldRefreshMeshes)
			for (const { uuid, scale, node } of prePostNodes) {
				this.prePostMatrices.set(uuid, getNodeMatrix(node, scale))
			}
			updatePreviewFast(animation, time, this.poseTargets, this.worldRefreshMeshes)
		}

		// Static subtrees (no keyframed ancestor) can't move after frame 0.
		const entries = tick === 0 ? this.nodeEntries : this.dynamicEntries
		for (const [uuid, node] of entries) {
			const outlinerNode = this.outlinerNodes.get(uuid)
			if (!outlinerNode) continue
			if (this.excludedNodes.has(uuid)) continue
			const keyframes = this.keyframesByNode.get(uuid)
			if (!keyframes) continue
			const keyframe = keyframes.get(tick)
			const prevKeyframe = keyframes.get(tick - 1)
			const lastFrame = this.lastFrameCache.get(uuid)

			let matrix: THREE.Matrix4 | undefined
			let interpolation: INodeTransform['interpolation']
			let fn: string | undefined
			let fnCondition: string | undefined

			switch (node.type) {
				case 'text_display':
				case 'item_display':
				case 'block_display':
				case 'bone': {
					matrix = getNodeMatrix(outlinerNode, node.base_scale, this.matrixScratch)
					interpolation = this.inheritedInterpolation(uuid, tick)
					// Only emit the frame if the matrix changed, this is the first
					// frame, or the interpolation changed.
					if (
						lastFrame &&
						matrixElementsEqual(lastFrame.matrix, matrix.elements) &&
						interpolation === undefined
					)
						continue
					if (keyframe?.interpolation === 'step') {
						interpolation = 'step'
					} else if (prevKeyframe?.data_points.length === 2) {
						interpolation = 'pre-post'
						matrix = this.prePostMatrices.get(uuid) ?? matrix
					}
					this.storeLastFrame(uuid, matrix.elements, keyframe)
					break
				}
				case 'interaction':
				case 'locator': {
					matrix = getNodeMatrix(outlinerNode, 1, this.matrixScratch)
					if (keyframe) {
						fn = keyframe.function
						fnCondition = keyframe.execute_condition
						this.storeLastFrame(uuid, matrix.elements, keyframe)
					} else if (lastFrame?.keyframe) {
						const repeat = lastFrame.keyframe.repeat
						const frequency = lastFrame.keyframe.repeat_frequency
						if (repeat && frequency && Math.round(time * TICK_RATE) % frequency === 0) {
							fn = lastFrame.keyframe.function
							fnCondition = lastFrame.keyframe.execute_condition
						}
					}
					break
				}
				case 'null_object':
				case 'camera':
				case 'struct': {
					matrix = getNodeMatrix(outlinerNode, 1, this.matrixScratch)
					// Only emit the frame if the matrix changed, or this is the first frame.
					if (lastFrame && matrixElementsEqual(lastFrame.matrix, matrix.elements))
						continue
					this.storeLastFrame(uuid, matrix.elements, keyframe)
					break
				}
				default:
					continue
			}

			if (!matrix) continue

			matrix.decompose(this.posScratch, this.quatScratch, this.scaleScratch)
			const pos: ArrayVector3 = [this.posScratch.x, this.posScratch.y, this.posScratch.z]
			const scale: ArrayVector3 = [
				this.scaleScratch.x,
				this.scaleScratch.y,
				this.scaleScratch.z,
			]
			this.eulerScratch.setFromQuaternion(this.quatScratch, 'YXZ')
			const rot: ArrayVector3 = [
				-this.eulerScratch.x * RAD_TO_DEG,
				-this.eulerScratch.y * RAD_TO_DEG + 180,
				this.eulerScratch.z * RAD_TO_DEG,
			]

			if (node.type === 'locator' || node.type === 'camera' || node.type === 'interaction') {
				node.max_distance = Math.max(node.max_distance, this.posScratch.length())
			}

			frame.node_transforms[uuid] = {
				// Every node type keeps a matrix: the datapack compiler compares them
				// to dedupe locator/camera/interaction frames, not just bone frames.
				matrix: matrix.elements.slice(),
				decomposed: this.enablePluginMode
					? {
							translation: pos,
							left_rotation: [
								this.quatScratch.x,
								this.quatScratch.y,
								this.quatScratch.z,
								this.quatScratch.w,
							] as ArrayVector4,
							scale,
						}
					: undefined,
				pos,
				rot,
				scale,
				head_rot: [rot[0], rot[1]] as ArrayVector2,
				interpolation,
				function: fn,
				function_execute_condition: fnCondition,
			}
		}

		return frame
	}
}

export function updatePreview(
	animation: _Animation,
	time: number,
	nodes: OutlinerNode[] = getAnimatableNodes()
) {
	Timeline.time = time
	Animator.showDefaultPose(true)
	for (const node of nodes) {
		if (!(node.constructor as any).animator) continue
		Animator.resetLastValues()
		animation.getBoneAnimator(node)!.displayFrame()
	}
	Animator.resetLastValues()
	// Only the rig's own subtree feeds `getNodeMatrix`; skip the grid, lights,
	// outline meshes and the rest of `Canvas.scene`. `updateWorldMatrix(true, ...)`
	// still refreshes the scene ancestor so `correctSceneAngle` is respected.
	Project!.model_3d.updateWorldMatrix(true, true)
	if (animation.effects) animation.effects.displayFrame()
}

/** Reset one node's mesh to its rest pose - mirrors the AJ `showDefaultPose` patch. */
function resetNodePose(node: OutlinerNode) {
	const mesh = node.mesh as THREE.Object3D & {
		fix_rotation?: THREE.Euler
		fix_position?: THREE.Vector3
		fix_scale?: THREE.Vector3
	}
	if (mesh.fix_rotation) mesh.rotation.copy(mesh.fix_rotation)
	if (mesh.fix_position) mesh.position.copy(mesh.fix_position)
	if (mesh.fix_scale) mesh.scale.copy(mesh.fix_scale)
	else if ((node.constructor as any).animator?.prototype?.channels?.scale) {
		mesh.scale.x = mesh.scale.y = mesh.scale.z = 1
	}
}

/**
 * Like {@link updatePreview}, but only touches the nodes this animation
 * actually keyframes. Valid for every tick after a full-scene
 * {@link updatePreview} has run for the animation (see `renderAnimation`'s
 * warm-up): nothing else in the rig moves, so resetting and re-posing only
 * these nodes, then sweeping `matrixWorld` for just the animated subtree, is
 * equivalent to the full pass but proportional to the animated subtree instead
 * of the whole model.
 *
 * `poseTargets` and `worldRefreshMeshes` must both be ordered ancestors-first.
 */
export function updatePreviewFast(
	animation: _Animation,
	time: number,
	poseTargets: AnimationSampler['poseTargets'],
	worldRefreshMeshes: THREE.Object3D[]
) {
	Timeline.time = time
	for (const { node } of poseTargets) resetNodePose(node)
	for (const { animator } of poseTargets) {
		Animator.resetLastValues()
		animator.displayFrame()
	}
	Animator.resetLastValues()
	// Only the posed nodes' local matrices actually changed. Refresh those, then
	// sweep world matrices down the animated subtree in parent-first order -
	// far cheaper than THREE re-composing every static descendant.
	Project!.model_3d.updateWorldMatrix(true, false)
	for (const { node } of poseTargets) node.mesh.updateMatrix()
	for (const mesh of worldRefreshMeshes) {
		mesh.matrixWorld.multiplyMatrices(mesh.parent!.matrixWorld, mesh.matrix)
	}
	if (animation.effects) animation.effects.displayFrame()
}

async function renderAnimation(
	animation: _Animation,
	rig: IRenderedRig,
	animatableNodes: OutlinerElement[]
) {
	const rendered = {
		name: animation.name,
		storage_name: sanitizeStorageKey(animation.name),
		uuid: animation.uuid,
		loop_delay: Number(animation.loop_delay) || 0,
		frames: [],
		duration: 0,
		loop_mode: animation.loop,
		modified_nodes: {},
	} as IRenderedAnimation
	animation.select()

	// Full-scene pass at t=0: establishes the rest of the rig for every later
	// (animated-subtree-only) tick, and resolves legacy name-keyed animators
	// onto their node UUIDs so the sampler's `animation.animators` view is
	// already migrated.
	updatePreview(animation, 0, animatableNodes)

	const sampler = new AnimationSampler(animation, rig.nodes, animatableNodes)
	const includedNodes = new Set<string>()

	// Matches the legacy `for (time = 0; time <= animation.length; time += 0.05)`
	// sampling, but stepping exact integer ticks avoids floating-point drift.
	const frameCount = Math.floor((animation.length + 1e-9) * TICK_RATE) + 1
	SUB_PROGRESS.set(0)
	SUB_MAX_PROGRESS.set(frameCount)
	const limiter = new MSLimiter(100)
	for (let tick = 0; tick / TICK_RATE <= animation.length + 1e-9; tick++) {
		const time = tick / TICK_RATE
		// Tick 0's scene is already posed by the warm-up above; later ticks only
		// need the animated subtree re-posed.
		if (tick > 0)
			updatePreviewFast(animation, time, sampler.poseTargets, sampler.worldRefreshMeshes)
		const frame = sampler.sample(tick)
		for (const uuid in frame.node_transforms) includedNodes.add(uuid)
		rendered.frames.push(frame)
		SUB_PROGRESS.set(tick + 1)
		// Let the dialog repaint on slow rigs. Safe here because nothing between
		// samples depends on the scene staying untouched across the yield. The
		// sync `needsSync` check keeps the common path off the microtask queue.
		if (limiter.needsSync()) await limiter.sync()
	}

	rendered.duration = rendered.frames.length
	const modifiedNodes: IRenderedAnimation['modified_nodes'] = {}
	for (const uuid of includedNodes) {
		modifiedNodes[uuid] = rig.nodes[uuid]
	}
	rendered.modified_nodes = modifiedNodes

	return rendered
}

export function hashAnimations(animations: IRenderedAnimation[]) {
	const hash = crypto.createHash('sha256')
	// One `hash.update` per frame rather than ~7 per node: the byte stream fed to
	// sha256 is byte-for-byte the same as concatenating the old pieces in order,
	// so the digest is unchanged.
	for (const animation of animations) {
		hash.update(
			'anim;' +
				animation.name +
				';' +
				animation.duration.toString() +
				';' +
				animation.loop_mode +
				';' +
				Object.keys(animation.modified_nodes).join(';')
		)
		for (const frame of animation.frames) {
			let s = ';' + frame.time.toString()
			const transforms = frame.node_transforms
			for (const uuid in transforms) {
				const node = transforms[uuid]
				s += ';' + uuid
				s += ';' + node.pos.join(';')
				s += ';' + node.rot.join(';')
				s += ';' + node.scale.join(';')
				if (node.interpolation) s += ';' + node.interpolation
				if (node.function) s += ';' + node.function
				if (node.function_execute_condition) s += ';' + node.function_execute_condition
			}
			if (frame.variants) {
				s += ';' + frame.variants
				if (frame.variants_execute_condition) s += ';' + frame.variants_execute_condition
			}
			if (frame.function) s += ';' + frame.function
			if (frame.function_execute_condition) s += ';' + frame.function_execute_condition
			hash.update(s)
		}
	}
	return hash.digest('hex')
}

export function getAnimatableNodes(): OutlinerElement[] {
	return [
		...NullObject.all,
		...Group.all,
		...Locator.all,
		...Interaction.all,
		...TextDisplay.all,
		...VanillaBlockDisplay.all,
		...VanillaItemDisplay.all,
		// @ts-expect-error - Broken BB types
		...(OutlinerElement.types.camera ? OutlinerElement.types.camera.all : []),
	]
}

export async function renderProjectAnimations(project: ModelProject, rig: IRenderedRig) {
	BONE_INTERPOLATION_ENABLED.set(false)

	setExportProgressPhase('Rendering Animations...', project.animations.length)

	console.time('Rendering animations took')
	let selectedAnimation: _Animation | undefined
	let currentTime = 0
	Timeline.pause()
	// Save selected animation
	if (Mode.selected.id === 'animate') {
		selectedAnimation = Animator.selected
		currentTime = Timeline.time
	}

	correctSceneAngle()
	const animatableNodes = getAnimatableNodes()
	const animations: IRenderedAnimation[] = []
	for (const animation of project.animations) {
		PROGRESS_DETAIL.set(animation.name)
		animations.push(await renderAnimation(animation, rig, animatableNodes))
		PROGRESS.set(PROGRESS.get() + 1)
		SUB_MAX_PROGRESS.set(0)
	}
	restoreSceneAngle()

	BONE_INTERPOLATION_ENABLED.set(true)

	// Restore selected animation
	if (Mode.selected.id === 'animate' && selectedAnimation) {
		selectedAnimation.select()
		Timeline.setTime(currentTime)
		Animator.preview()
	} else if (Mode.selected.id === 'edit') {
		Animator.showDefaultPose()
	}

	console.timeEnd('Rendering animations took')
	return animations
}
