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
	matrix: THREE.Matrix4
	decomposed: {
		translation: THREE.Vector3
		left_rotation: THREE.Quaternion
		scale: THREE.Vector3
	}
	pos: ArrayVector3
	rot: ArrayVector3
	scale: ArrayVector3
	// The two-axis (entity head) rotation of the node.
	head_rot: ArrayVector2
	interpolation?: 'step' | 'pre-post'

	commands?: string
	execute_condition?: string
}

export interface IRenderedFrame {
	time: number
	node_transforms: Record<string, INodeTransform>
	variant?: {
		uuid: string
		execute_condition?: string
	}
	commands?: {
		commands: string
		execute_condition?: string
	}
}

export interface IRenderedAnimation {
	name: string
	uuid: string
	safe_name: string
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

let lastAnimation: _Animation | undefined
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
let nodeCache = new Map<string, OutlinerElement>()
export function getFrame(
	animation: _Animation,
	nodeMap: IRenderedRig['nodes'],
	time = 0
): IRenderedFrame {
	const frame: IRenderedFrame = {
		time,
		node_transforms: {},
		variant: getVariantKeyframe(animation, time),
		commands: getCommandsKeyframe(animation, time),
	}

	if (lastAnimation !== animation) {
		lastAnimation = animation
		lastFrameCache = new Map()
		keyframeCache = new Map()
		for (const uuid of Object.keys(nodeMap)) {
			const animator: GeneralAnimator | undefined = animation.animators[uuid]
			if (!animator) continue
			const keyframeMap = animator.keyframes
				? new Map(animator.keyframes.map(kf => [kf.time, kf]))
				: new Map<number, _Keyframe>()
			keyframeCache.set(uuid, keyframeMap)
		}
		excludedNodesCache = new Set(
			animation.excluded_nodes ? animation.excluded_nodes.map(b => b.value) : []
		)
		nodeCache = new Map()
		for (const node of getAnimatableNodes()) {
			nodeCache.set(node.uuid, node)
		}
	}

	for (const [uuid, node] of Object.entries(nodeMap)) {
		const outlinerNode = nodeCache.get(uuid)
		if (!outlinerNode) continue
		if (excludedNodesCache.has(uuid)) continue
		const keyframes = keyframeCache.get(uuid)
		if (!keyframes) continue
		const keyframe = keyframes.get(time)
		const prevKeyframe = keyframes.get(time - 0.05)
		const lastFrame = lastFrameCache.get(uuid)

		let matrix: THREE.Matrix4
		let interpolation: INodeTransform['interpolation']
		let commands: string | undefined
		let executeCondition: string | undefined
		let repeat: boolean | undefined
		let repeatFrequency: number | undefined

		switch (node.type) {
			case 'text_display':
			case 'item_display':
			case 'block_display':
			case 'bone': {
				matrix = getNodeMatrix(outlinerNode, node.base_scale)
				// Only add the frame if the matrix has changed.
				if (lastFrame && lastFrame.matrix.equals(matrix)) continue
				// Inherit instant interpolation from parent
				if (node.parent && node.parent !== 'root') {
					const parentKeyframes = keyframeCache.get(node.parent)
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
					updatePreview(animation, time + 0.001)
					const postMatrix = getNodeMatrix(outlinerNode, node.base_scale)
					console.warn('pre-post', matrix.equals(postMatrix), matrix, postMatrix)
					matrix = postMatrix
					updatePreview(animation, time)
				}

				lastFrameCache.set(uuid, { matrix, keyframe })
				break
			}
			case 'locator': {
				matrix = getNodeMatrix(outlinerNode, 1)
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
			case 'camera':
			case 'struct': {
				matrix = getNodeMatrix(outlinerNode, 1)
				break
			}
		}

		const pos = new THREE.Vector3()
		const rot = new THREE.Quaternion()
		const scale = new THREE.Vector3()
		matrix.decompose(pos, rot, scale)
		const decomposed = getDecomposedTransformation(matrix)

		frame.node_transforms[uuid] = {
			matrix,
			decomposed,
			pos: [pos.x, pos.y, pos.z],
			rot: eulerFromQuaternion(rot).toArray(),
			scale: [scale.x, scale.y, scale.z],
			head_rot: threeAxisRotationToTwoAxisRotation(rot),
			interpolation,
			commands,
			execute_condition: executeCondition,
		}
	}

	return frame
}

function getVariantKeyframe(animation: _Animation, time: number): IRenderedFrame['variant'] {
	const variantKeyframes = animation.animators.effects?.variant as _Keyframe[]
	if (!variantKeyframes) return
	for (const kf of variantKeyframes) {
		if (kf.time !== time) continue
		const uuid = getKeyframeVariant(kf)
		if (!uuid) return
		return {
			uuid,
			execute_condition: getKeyframeExecuteCondition(kf),
		}
	}
}

function getCommandsKeyframe(animation: _Animation, time: number): IRenderedFrame['commands'] {
	const commandsKeyframes = animation.animators.effects?.commands as _Keyframe[]
	if (!commandsKeyframes) return
	for (const kf of commandsKeyframes) {
		if (kf.time !== time) continue
		const commands = getKeyframeCommands(kf)
		if (!commands) return
		return {
			commands,
			execute_condition: getKeyframeExecuteCondition(kf),
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
		name: animation.name,
		uuid: animation.uuid,
		safe_name: toSafeFuntionName(animation.name).replaceAll('.', '_'),
		loop_delay: Number(animation.loop_delay) || 0,
		frames: [],
		duration: 0,
		loop_mode: animation.loop,
		modified_nodes: {},
	} as IRenderedAnimation
	animation.select()

	const includedNodes = new Set<string>()

	for (let time = 0; time <= animation.length; time = roundToNth(time + 0.05, 20)) {
		updatePreview(animation, time)
		const frame: IRenderedFrame = getFrame(animation, rig.nodes, time)
		Object.keys(frame.node_transforms).forEach(n => includedNodes.add(n))
		rendered.frames.push(frame)
	}
	rendered.duration = rendered.frames.length
	rendered.modified_nodes = Object.fromEntries(
		Array.from(includedNodes).map(uuid => [uuid, rig.nodes[uuid]])
	)

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
				if (node.commands) hash.update(';' + node.commands)
				if (node.execute_condition) hash.update(';' + node.execute_condition)
			}
			if (frame.variant) {
				hash.update(';' + frame.variant.uuid)
				if (frame.variant.execute_condition)
					hash.update(';' + frame.variant.execute_condition)
			}
		}
	}
	return hash.digest('hex')
}

export function getAnimatableNodes(): OutlinerElement[] {
	return [
		...Group.all,
		...Locator.all,
		...TextDisplay.all,
		...VanillaBlockDisplay.all,
		...VanillaItemDisplay.all,
		...(OutlinerElement.types.camera ? OutlinerElement.types.camera.all : []),
	]
}

export function renderProjectAnimations(project: ModelProject, rig: IRenderedRig) {
	// Clear the cache
	lastAnimation = undefined
	lastFrameCache = new Map()
	keyframeCache = new Map()
	excludedNodesCache = new Set()
	nodeCache = new Map()

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
	console.log('Animations:', animations)
	return animations
}
