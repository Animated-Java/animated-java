import { LimitClock, roundToN } from '../util/misc'
import { ProgressBarController } from '../util/progress'
import { IRenderedRig } from './modelRenderer'
let progress: ProgressBarController

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
	matrixWorld.setPosition(
		new THREE.Vector3().setFromMatrixPosition(matrixWorld).multiplyScalar(1 / 16)
	)
	matrixWorld.scale(new THREE.Vector3().setScalar(scale))
	return matrixWorld
}

export interface IAnimationNode {
	type: 'bone' | 'camera' | 'locator'
	name: string
	uuid: string
	node?: Group | NullObject | Locator | OutlinerElement
	matrix: THREE.Matrix4
	pos: THREE.Vector3
	rot: THREE.Quaternion
	scale: THREE.Vector3
	interpolation?: 'instant' | 'default'
}

export interface IRenderedFrame {
	time: number
	nodes: IAnimationNode[]
	variant?: {
		uuid: string
		executeCondition: string
	}
	commands?: {
		commands: string
		executeCondition: string
	}
	animationState?: {
		animation: string
		executeCondition: string
	}
}

export interface IRenderedAnimation {
	name: string
	startDelay: number
	loopDelay: number
	frames: IRenderedFrame[]
	/**
	 * Duration of the animation in ticks (AKA frames). Same as animation.frames.length
	 */
	duration: number
	loopMode: 'loop' | 'once' | 'hold'
}

let lastAnimation: _Animation
let previousFrame: Record<
	string,
	{ matrix: number[]; interpolation: IAnimationNode['interpolation'] }
>
export function getAnimationNodes(
	animation: _Animation,
	nodeMap: IRenderedRig['nodeMap'],
	time = 0
) {
	if (lastAnimation !== animation) {
		lastAnimation = animation
		previousFrame = {}
	}
	const nodes: IAnimationNode[] = []

	for (const [uuid, node] of Object.entries(nodeMap)) {
		if (!node.node.export) continue
		const included = animation.affected_bones.find(b => b.value === uuid)
		// Ignore this bone if it's not affected by this animation
		if (
			(!included && animation.affected_bones_is_a_whitelist) ||
			(included && !animation.affected_bones_is_a_whitelist)
		)
			continue

		const prevFrame = previousFrame[uuid]
		let interpolation: IAnimationNode['interpolation'] = undefined
		let matrix: THREE.Matrix4
		switch (node.type) {
			case 'bone': {
				matrix = getNodeMatrix(node.node, node.scale)
				const animator = animation.animators[node.node.uuid]!
				if (
					animator?.keyframes
						.filter(k => k.time === roundToN(time - 0.05, 20))
						.find(k => k.data_points.length === 2)
				) {
					interpolation = 'instant'
				} else if (previousFrame[uuid]?.interpolation === 'instant') {
					interpolation = 'default'
				}
				break
			}
			case 'locator':
			case 'camera':
				matrix = getNodeMatrix(node.node, 1)
				break
		}

		const pos = new THREE.Vector3()
		const rot = new THREE.Quaternion()
		const scale = new THREE.Vector3()
		matrix.decompose(pos, rot, scale)
		const matrixArray = matrix.toArray()

		if (
			node.type === 'bone' &&
			prevFrame !== undefined &&
			prevFrame.matrix !== undefined &&
			prevFrame.matrix.equals(matrixArray) &&
			prevFrame.interpolation === interpolation
		)
			continue
		previousFrame[uuid] = {
			matrix: matrixArray,
			interpolation,
		}

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
		})
	}

	return nodes
}

function getVariantKeyframe(animation: _Animation, time: number) {
	if (!animation.animators.effects?.variants) return
	for (const kf of animation.animators.effects.variants as _Keyframe[]) {
		if (kf.time === time)
			return {
				uuid: kf.data_points[0].variant,
				executeCondition: kf.data_points[0].executeCondition,
			}
	}
}

function getCommandsKeyframe(animation: _Animation, time: number) {
	if (!animation.animators.effects?.commands) return
	for (const kf of animation.animators.effects.commands as _Keyframe[]) {
		if (kf.time === time)
			return {
				commands: kf.data_points[0].commands,
				executeCondition: kf.data_points[0].executeCondition,
			}
	}
}

function getAnimationStateKeyframe(animation: _Animation, time: number) {
	if (!animation.animators.effects?.animationStates) return
	for (const kf of animation.animators.effects.animationStates as _Keyframe[]) {
		if (kf.time === time)
			return {
				animation: kf.data_points[0].animationState,
				executeCondition: kf.data_points[0].executeCondition,
			}
	}
}

export function updatePreview(animation: _Animation, time: number) {
	Timeline.time = time
	Animator.showDefaultPose(true)
	const nodes: OutlinerNode[] = [...Group.all, ...NullObject.all, ...Locator.all]
	if (OutlinerElement.types.camera) {
		nodes.push(...OutlinerElement.types.camera.all)
	}
	for (const node of nodes) {
		if (!(node.constructor as any).animator) continue
		Animator.resetLastValues()
		animation.getBoneAnimator(node).displayFrame(1)
	}
	Animator.resetLastValues()
	scene.updateMatrixWorld()
	if (animation.effects) animation.effects.displayFrame()
	Blockbench.dispatchEvent('display_animation_frame')
}

export async function renderAnimation(animation: _Animation, rig: IRenderedRig) {
	const rendered = {
		name: animation.name,
		startDelay: Number(animation.start_delay),
		loopDelay: Number(animation.loop_delay),
		frames: [],
		duration: 0,
		loopMode: animation.loop,
	} as IRenderedAnimation
	animation.select()

	const clock = new LimitClock(10)
	for (let time = 0; time <= animation.length; time = roundToN(time + 0.05, 20)) {
		// await new Promise(resolve => requestAnimationFrame(resolve))
		// await new Promise(resolve => setTimeout(resolve, 50))
		updatePreview(animation, time)
		rendered.frames.push({
			time,
			nodes: getAnimationNodes(animation, rig.nodeMap, time),
			variant: getVariantKeyframe(animation, time),
			commands: getCommandsKeyframe(animation, time),
			animationState: getAnimationStateKeyframe(animation, time),
		})
		progress.add(1)
		await clock.sync().then(b => b && progress.update())
	}
	rendered.duration = rendered.frames.length

	return rendered
}

function gatherProgress(): number {
	return Animator.animations.reduce((a, b) => a + b.length * 20, 0)
}

export async function renderAllAnimations(rig: IRenderedRig) {
	let selectedAnimation: _Animation | undefined
	let currentTime = 0
	progress = new ProgressBarController('Rendering Animations...', gatherProgress())
	Timeline.pause()
	// Save selected animation
	if (Mode.selected.id === 'animate') {
		selectedAnimation = Animator.selected
		currentTime = Timeline.time
	}

	correctSceneAngle()
	const animations: IRenderedAnimation[] = []
	for (const animation of Animator.animations) {
		animations.push(await renderAnimation(animation, rig))
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

	return animations
}
