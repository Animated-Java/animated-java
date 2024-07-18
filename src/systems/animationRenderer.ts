import {
	getKeyframeCommands,
	getKeyframeExecuteCondition,
	getKeyframeRepeat,
	getKeyframeRepeatFrequency,
	getKeyframeVariant,
} from '../mods/customKeyframesMod'
import { TextDisplay } from '../outliner/textDisplay'
import { VanillaBlockDisplay } from '../outliner/vanillaBlockDisplay'
import { VanillaItemDisplay } from '../outliner/vanillaItemDisplay'
import { toSafeFuntionName } from '../util/minecraftUtil'
import { eulerFromQuaternion, roundToNth } from '../util/misc'
import { AnyRenderedNode, IRenderedRig } from './rigRenderer'
import * as crypto from 'crypto'

export function correctSceneAngle() {
	main_preview.controls.rotateLeft(Math.PI)
	scene.setRotationFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI)
}

export function restoreSceneAngle() {
	main_preview.controls.rotateLeft(-Math.PI)
	scene.setRotationFromAxisAngle(new THREE.Vector3(0, 1, 0), 0)
}

function getNodeMatrix(node: OutlinerElement, scale: number) {
	const matrixWorld = node.mesh.matrixWorld.clone()
	const pos = new THREE.Vector3().setFromMatrixPosition(matrixWorld).multiplyScalar(1 / 16)
	matrixWorld.setPosition(pos)

	const scaleVec = new THREE.Vector3().setScalar(scale)
	matrixWorld.scale(scaleVec)

	if (node instanceof TextDisplay) {
		matrixWorld.multiply(
			new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(0, Math.PI, 0, 'XYZ'))
		)
	}

	return matrixWorld
}

function getDecomposedTransformation(matrix: THREE.Matrix4) {
	const translation = new THREE.Vector3()
	const left_rotation = new THREE.Quaternion()
	const scale = new THREE.Vector3()
	matrix.decompose(translation, left_rotation, scale)
	return { translation, left_rotation, scale }
}

function threeAxisRotationToTwoAxisRotation(rot: THREE.Quaternion): ArrayVector2 {
	const euler = new THREE.Euler().setFromQuaternion(rot, 'YXZ')
	return [Math.radToDeg(-euler.x), Math.radToDeg(-euler.y) + 180]
}

export interface INodeTransform {
	type:
		| 'bone'
		| 'struct'
		| 'camera'
		| 'locator'
		| 'text_display'
		| 'item_display'
		| 'block_display'
	name: string
	uuid: string
	node?: Group | NullObject | Locator | OutlinerElement | TextDisplay
	matrix: THREE.Matrix4
	transformation: {
		translation: THREE.Vector3
		left_rotation: THREE.Quaternion
		scale: THREE.Vector3
	}
	pos: ArrayVector3
	rot: ArrayVector3
	// The two-axis (entity head) rotation of the node.
	head_rot: ArrayVector2
	scale: ArrayVector3
	interpolation?: 'step' | 'pre-post'
	/**
	 * Commands is only set for locator nodes
	 */
	commands?: string
	/**
	 * Execute condition is only set for locator nodes
	 */
	execute_condition?: string
}

export interface IRenderedFrame {
	time: number
	node_transforms: INodeTransform[]
	variant?: {
		uuid: string
		executeCondition?: string
	}
}

export interface IRenderedAnimation {
	name: string
	storageSafeName: string
	loopDelay: number
	frames: IRenderedFrame[]
	/**
	 * Duration of the animation in ticks (AKA frames). Same as animation.frames.length
	 */
	duration: number
	loopMode: 'loop' | 'once' | 'hold'
	includedNodes: AnyRenderedNode[]
}

let lastAnimation: _Animation
interface ILastFrameCacheItem {
	matrix: THREE.Matrix4
	keyframe?: _Keyframe
}
let lastFrameCache = new Map<string, ILastFrameCacheItem>()
/**
 * Map of node UUIDs to a map of times to keyframes
 */
let keyframeCache = new Map<string, Map<number, _Keyframe | undefined>>()
let excludedNodesCache = new Set<string>()
export function getNodeTransforms(
	animation: _Animation,
	nodeMap: IRenderedRig['nodeMap'],
	time = 0
) {
	if (lastAnimation !== animation) {
		lastAnimation = animation
		lastFrameCache = new Map()
		keyframeCache = new Map()
		for (const [uuid, node] of Object.entries(nodeMap)) {
			const animator = animation.getBoneAnimator(node.node)
			const keyframeMap = animator.keyframes
				? new Map(animator.keyframes.map(kf => [kf.time, kf]))
				: new Map<number, _Keyframe>()
			keyframeCache.set(uuid, keyframeMap)
		}
		excludedNodesCache = new Set(
			animation.excluded_nodes ? animation.excluded_nodes.map(b => b.value) : []
		)
	}
	const nodes: INodeTransform[] = []

	for (const [uuid, node] of Object.entries(nodeMap)) {
		if (!node.node.export) continue
		if (excludedNodesCache.has(uuid)) continue
		const keyframes = keyframeCache.get(uuid)
		if (!keyframes) continue
		const keyframe = keyframes.get(time)
		const prevKeyframe = keyframes.get(time - 0.05)
		const lastFrame = lastFrameCache.get(uuid)

		let matrix: THREE.Matrix4
		let interpolation: INodeTransform['interpolation']
		let commands,
			executeCondition: string | undefined,
			repeat: boolean | undefined,
			repeatFrequency: number | undefined
		switch (node.type) {
			case 'text_display':
			case 'item_display':
			case 'block_display':
			case 'bone': {
				matrix = getNodeMatrix(node.node, node.scale)
				// Only add the frame if the matrix has changed.
				// NOTE - Disabled because it causes issues with vanilla interpolation.
				if (lastFrame && lastFrame.matrix.equals(matrix)) continue
				// Inherit instant interpolation from parent
				if (node.parentNode) {
					const parentKeyframes = keyframeCache.get(node.parentNode.uuid)
					const parentKeyframe = parentKeyframes?.get(time)
					const prevParentKeyframe = parentKeyframes?.get(time - 0.05)
					if (parentKeyframe?.interpolation === 'step') {
						interpolation = 'step'
					} else if (prevParentKeyframe?.data_points.length === 2) {
						interpolation = 'pre-post'
					}
				}
				// Instant interpolation
				if (keyframe?.interpolation === 'step') {
					interpolation = 'step'
				} else if (prevKeyframe?.data_points.length === 2) {
					interpolation = 'pre-post'
				}

				lastFrameCache.set(uuid, { matrix, keyframe })
				break
			}
			case 'locator': {
				matrix = getNodeMatrix(node.node, 1)
				if (keyframe) {
					commands = getKeyframeCommands(keyframe)
					executeCondition = getKeyframeExecuteCondition(keyframe)
					lastFrameCache.set(uuid, { matrix, keyframe })
				} else if (lastFrame?.keyframe) {
					repeat = getKeyframeRepeat(lastFrame.keyframe)
					repeatFrequency = getKeyframeRepeatFrequency(lastFrame.keyframe)
					if (
						repeat &&
						repeatFrequency &&
						Math.round(time * 20) % repeatFrequency === 0
					) {
						commands = getKeyframeCommands(lastFrame.keyframe)
						executeCondition = getKeyframeExecuteCondition(lastFrame.keyframe)
					}
				}
				break
			}
			case 'camera': {
				matrix = getNodeMatrix(node.node, 1)
				break
			}
			case 'struct': {
				matrix = getNodeMatrix(node.node, 1)
				break
			}
		}

		const pos = new THREE.Vector3()
		const rot = new THREE.Quaternion()
		const scale = new THREE.Vector3()
		matrix.decompose(pos, rot, scale)
		const decomposed = getDecomposedTransformation(matrix)

		nodes.push({
			type: node.type,
			name: node.name,
			uuid,
			node: node.node,
			matrix,
			transformation: decomposed,
			pos: [pos.x, pos.y, pos.z],
			rot: eulerFromQuaternion(rot).toArray(),
			head_rot: threeAxisRotationToTwoAxisRotation(rot),
			scale: [scale.x, scale.y, scale.z],
			interpolation,
			commands,
			execute_condition: executeCondition,
		})
	}

	return nodes
}

function getVariantKeyframe(animation: _Animation, time: number) {
	const variantKeyframes = animation.animators.effects?.variant as _Keyframe[]
	if (!variantKeyframes) return
	for (const kf of variantKeyframes) {
		if (kf.time !== time) continue
		const uuid = getKeyframeVariant(kf)
		if (!uuid) return
		const executeCondition = getKeyframeExecuteCondition(kf)
		return {
			uuid,
			executeCondition,
		}
	}
}

export function updatePreview(animation: _Animation, time: number) {
	Timeline.time = time
	Animator.showDefaultPose(true)
	const nodes: OutlinerNode[] = [
		...Group.all,
		...NullObject.all,
		...Locator.all,
		...TextDisplay.all,
		...VanillaBlockDisplay.all,
		...VanillaItemDisplay.all,
	]
	if (OutlinerElement.types.camera) {
		nodes.push(...OutlinerElement.types.camera.all)
	}
	for (const node of nodes) {
		if (!(node.constructor as any).animator) continue
		Animator.resetLastValues()
		animation.getBoneAnimator(node).displayFrame()
	}
	Animator.resetLastValues()
	scene.updateMatrixWorld()
	if (animation.effects) animation.effects.displayFrame()
	// Blockbench.dispatchEvent('display_animation_frame')
}

export function renderAnimation(animation: _Animation, rig: IRenderedRig) {
	const rendered = {
		name: toSafeFuntionName(animation.name),
		storageSafeName: toSafeFuntionName(animation.name).replaceAll('.', '_'),
		loopDelay: Number(animation.loop_delay) || 0,
		frames: [],
		duration: 0,
		loopMode: animation.loop,
		includedNodes: [],
	} as IRenderedAnimation
	animation.select()

	const includedNodes = new Set<string>()

	for (let time = 0; time <= animation.length; time = roundToNth(time + 0.05, 20)) {
		updatePreview(animation, time)
		const frame: IRenderedFrame = {
			time,
			node_transforms: getNodeTransforms(animation, rig.nodeMap, time),
			variant: getVariantKeyframe(animation, time),
		}
		frame.node_transforms.forEach(n => includedNodes.add(n.uuid))
		rendered.frames.push(frame)
	}
	rendered.duration = rendered.frames.length

	rendered.includedNodes = Object.values(rig.nodeMap).filter(n => includedNodes.has(n.uuid))

	return rendered
}

export function hashAnimations(animations: IRenderedAnimation[]) {
	const hash = crypto.createHash('sha256')
	for (const animation of animations) {
		hash.update('anim;' + animation.name)
		hash.update(';' + animation.duration.toString())
		hash.update(';' + animation.loopMode)
		hash.update(';' + animation.includedNodes.map(n => n.uuid).join(';'))
		for (const frame of animation.frames) {
			hash.update(';' + frame.time.toString())
			for (const node of frame.node_transforms) {
				hash.update(';' + node.uuid)
				hash.update(';' + node.pos.join(';'))
				hash.update(';' + node.rot.join(';'))
				hash.update(';' + node.scale.join(';'))
				node.interpolation && hash.update(';' + node.interpolation)
				if (node.commands) hash.update(';' + node.commands)
				if (node.execute_condition) hash.update(';' + node.execute_condition)
			}
			if (frame.variant) {
				hash.update(';' + frame.variant.uuid)
				if (frame.variant.executeCondition)
					hash.update(';' + frame.variant.executeCondition)
			}
		}
	}
	return hash.digest('hex')
}

export function renderProjectAnimations(project: ModelProject, rig: IRenderedRig) {
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
	const animations: IRenderedAnimation[] = []
	for (const animation of project.animations) {
		animations.push(renderAnimation(animation, rig))
	}
	restoreSceneAngle()

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
