import { transposeMatrix, LimitClock, roundToN } from '../util/misc'
import { ProgressBarController } from '../util/progress'
import { IRenderedRig } from './modelRenderer'
let progress: ProgressBarController

function getGroupMatrix(group: Group, scale: number) {
	const matrix = group.mesh.matrixWorld.clone()
	matrix.setPosition(new THREE.Vector3().setFromMatrixPosition(matrix).multiplyScalar(1 / 16))
	matrix.scale(new THREE.Vector3().setScalar(scale))
	return matrix
}

export interface IAnimationBone {
	name: string
	uuid: string
	group?: Group
	matrix: number[]
}

export interface IRenderedAnimation {
	name: string
	frames: Array<{
		bones: IAnimationBone[]
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
	}>
	/**
	 * Duration of the animation in ticks (AKA frames). Same as animation.frames.length
	 */
	duration: number
	loopMode: 'loop' | 'once' | 'hold'
}

export function getAnimationBones(animation: _Animation, boneMap: IRenderedRig['boneMap']) {
	const bones: IAnimationBone[] = []

	for (const group of Group.all) {
		if (!group.export) continue
		const included = animation.affected_bones.find(b => b.value === group.uuid)
		// Ignore this bone if it's not affected by this animation
		if (
			(!included && animation.affected_bones_is_a_whitelist) ||
			(included && !animation.affected_bones_is_a_whitelist)
		)
			continue
		const matrix = getGroupMatrix(group, boneMap[group.uuid].scale)

		bones.push({
			name: group.name,
			uuid: group.uuid,
			group: group,
			matrix: transposeMatrix(matrix.toArray()),
		})
	}

	return bones
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

function updatePreview(animation: _Animation, time: number) {
	Timeline.time = time
	Animator.showDefaultPose(true)
	Animator.resetLastValues()
	for (const node of [
		...Group.all,
		...NullObject.all,
		...Locator.all,
		...OutlinerElement.types.camera.all,
	]) {
		animation.getBoneAnimator(node).displayFrame(1)
		if (animation.effects) animation.effects.displayFrame()
	}
	Animator.resetLastValues()
	scene.updateMatrixWorld()
	if (Group.selected) {
		Transformer.updateSelection()
	}
	Blockbench.dispatchEvent('display_animation_frame')
}

export async function renderAnimation(animation: _Animation, rig: IRenderedRig) {
	const rendered = {
		name: animation.name,
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
			bones: getAnimationBones(animation, rig.boneMap),
			variant: getVariantKeyframe(animation, time),
			commands: getCommandsKeyframe(animation, time),
			animationState: getAnimationStateKeyframe(animation, time),
		})
		await clock.sync()
	}
	rendered.duration = rendered.frames.length
	return rendered
}

export async function renderAllAnimations(rig: IRenderedRig) {
	let selectedAnimation: _Animation | undefined
	let currentTime = 0
	progress = new ProgressBarController('Rendering Animations...', Animator.animations.length)
	Timeline.pause()
	// Save selected animation
	if (Mode.selected.id === 'animate') {
		selectedAnimation = Animator.selected
		currentTime = Timeline.time
	}

	const animations: IRenderedAnimation[] = []

	for (const animation of Animator.animations) {
		animations.push(await renderAnimation(animation, rig))
		progress.add(1)
	}

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
