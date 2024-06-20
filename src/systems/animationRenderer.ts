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
import { roundToNth } from '../util/misc'
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
	// Hacky way to force the matrix to update in-game
	scaleVec.x += Math.random() * 0.00001
	scaleVec.y += Math.random() * 0.00001
	scaleVec.z += Math.random() * 0.00001
	matrixWorld.scale(scaleVec)

	if (node instanceof TextDisplay) {
		matrixWorld.multiply(
			new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(0, Math.PI, 0, 'XYZ'))
		)
	}

	return matrixWorld
}

export interface IAnimationNode {
	type: 'bone' | 'camera' | 'locator' | 'text_display' | 'item_display' | 'block_display'
	name: string
	uuid: string
	node?: Group | NullObject | Locator | OutlinerElement | TextDisplay
	matrix: THREE.Matrix4
	pos: THREE.Vector3
	rot: THREE.Quaternion
	scale: THREE.Vector3
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
	nodes: IAnimationNode[]
	variant?: {
		uuid: string
		executeCondition?: string
	}
}

export interface IRenderedAnimation {
	name: string
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
let excludedBonesCache = new Set<string>()
export function getAnimationNodes(
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
			const keyframeMap = new Map(animator.keyframes.map(kf => [kf.time, kf]))
			keyframeCache.set(uuid, keyframeMap)
		}
		excludedBonesCache = new Set(animation.excluded_bones.map(b => b.value))
	}
	const nodes: IAnimationNode[] = []

	for (const [uuid, node] of Object.entries(nodeMap)) {
		if (!node.node.export) continue
		if (excludedBonesCache.has(uuid)) continue
		const keyframes = keyframeCache.get(uuid)
		if (!keyframes) continue
		const keyframe = keyframes.get(time)
		const prevKeyframe = keyframes.get(time - 0.05)
		const lastFrame = lastFrameCache.get(uuid)

		let matrix: THREE.Matrix4
		let interpolation: IAnimationNode['interpolation']
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
				// if (lastFrame && lastFrame.matrix.equals(matrix)) continue
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

				// lastFrameCache.set(uuid, { matrix, keyframe })
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
		}

		const pos = new THREE.Vector3()
		const rot = new THREE.Quaternion()
		const scale = new THREE.Vector3()
		matrix.decompose(pos, rot, scale)

		nodes.push({
			type: node.type,
			name: node.name,
			uuid,
			node: node.node,
			matrix,
			pos,
			rot,
			scale,
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
	Blockbench.dispatchEvent('display_animation_frame')
}

export function renderAnimation(animation: _Animation, rig: IRenderedRig) {
	const rendered = {
		name: animation.name,
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
		const frame = {
			time,
			nodes: getAnimationNodes(animation, rig.nodeMap, time),
			variant: getVariantKeyframe(animation, time),
		}
		frame.nodes.forEach(n => includedNodes.add(n.uuid))
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
			for (const node of frame.nodes) {
				hash.update(';' + node.uuid)
				hash.update(';' + node.pos.toArray().join(';'))
				hash.update(';' + node.rot.toArray().join(';'))
				hash.update(';' + node.scale.toArray().join(';'))
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
