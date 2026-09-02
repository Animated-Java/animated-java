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

function getNodeMatrix(node: OutlinerElement, scale: number) {
	const matrixWorld = node.mesh.matrixWorld.clone()
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
	private readonly animatableNodes: OutlinerElement[]
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

	private readonly posScratch = new THREE.Vector3()
	private readonly quatScratch = new THREE.Quaternion()
	private readonly scaleScratch = new THREE.Vector3()
	private readonly eulerScratch = new THREE.Euler()

	constructor(
		animation: _Animation,
		nodeMap: IRenderedRig['nodes'],
		animatableNodes: OutlinerElement[]
	) {
		this.animation = animation
		this.nodeEntries = Object.entries(nodeMap)
		this.animatableNodes = animatableNodes
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

	sample(tick: number): IRenderedFrame {
		const { animation } = this
		const time = tick / TICK_RATE

		const frame: IRenderedFrame = {
			time,
			node_transforms: {},
			...this.getVariantFrame(tick),
			...this.getFunctionFrame(tick),
		}

		for (const [uuid, node] of this.nodeEntries) {
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
					matrix = getNodeMatrix(outlinerNode, node.base_scale)
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
						updatePreview(animation, time + 0.001, this.animatableNodes)
						matrix = getNodeMatrix(outlinerNode, node.base_scale)
						updatePreview(animation, time, this.animatableNodes)
					}
					this.lastFrameCache.set(uuid, {
						matrix: matrix.elements.slice(),
						keyframe,
					})
					break
				}
				case 'interaction':
				case 'locator': {
					matrix = getNodeMatrix(outlinerNode, 1)
					if (keyframe) {
						fn = keyframe.function
						fnCondition = keyframe.execute_condition
						this.lastFrameCache.set(uuid, {
							matrix: matrix.elements.slice(),
							keyframe,
						})
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
					matrix = getNodeMatrix(outlinerNode, 1)
					// Only emit the frame if the matrix changed, or this is the first frame.
					if (lastFrame && matrixElementsEqual(lastFrame.matrix, matrix.elements))
						continue
					this.lastFrameCache.set(uuid, {
						matrix: matrix.elements.slice(),
						keyframe,
					})
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
		updatePreview(animation, time, animatableNodes)
		const frame = sampler.sample(tick)
		for (const uuid in frame.node_transforms) includedNodes.add(uuid)
		rendered.frames.push(frame)
		SUB_PROGRESS.set(tick + 1)
		// Let the dialog repaint on slow rigs. Safe here because nothing between
		// samples depends on the scene staying untouched across the yield.
		await limiter.sync()
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
	for (const animation of animations) {
		hash.update('anim;' + animation.name)
		hash.update(';' + animation.duration.toString())
		hash.update(';' + animation.loop_mode)
		hash.update(';' + Object.keys(animation.modified_nodes).join(';'))
		for (const frame of animation.frames) {
			hash.update(';' + frame.time.toString())
			for (const [uuid, node] of Object.entries(frame.node_transforms)) {
				hash.update(';' + uuid)
				hash.update(';' + node.pos.join(';'))
				hash.update(';' + node.rot.join(';'))
				hash.update(';' + node.scale.join(';'))
				node.interpolation && hash.update(';' + node.interpolation)
				if (node.function) hash.update(';' + node.function)
				if (node.function_execute_condition)
					hash.update(';' + node.function_execute_condition)
			}
			if (frame.variants) {
				hash.update(';' + frame.variants)
				if (frame.variants_execute_condition)
					hash.update(';' + frame.variants_execute_condition)
			}
			if (frame.function) hash.update(';' + frame.function)
			if (frame.function_execute_condition)
				hash.update(';' + frame.function_execute_condition)
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
	console.log('Animations:', animations)
	return animations
}
