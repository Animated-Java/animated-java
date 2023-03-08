import { LimitClock, roundToN } from '../util/misc'
import { ProgressBarController } from '../util/progress'
let progress: ProgressBarController

export function columnToRowMajor(matrixArray: number[]) {
	const m11 = matrixArray[0],
		m12 = matrixArray[4],
		m13 = matrixArray[8],
		m14 = matrixArray[12]
	const m21 = matrixArray[1],
		m22 = matrixArray[5],
		m23 = matrixArray[9],
		m24 = matrixArray[13]
	const m31 = matrixArray[2],
		m32 = matrixArray[6],
		m33 = matrixArray[10],
		m34 = matrixArray[14]
	const m41 = matrixArray[3],
		m42 = matrixArray[7],
		m43 = matrixArray[11],
		m44 = matrixArray[15]

	return [m11, m12, m13, m14, m21, m22, m23, m24, m31, m32, m33, m34, m41, m42, m43, m44]
}

function getGroupMatrixArray(group: Group) {
	const matrix = group.mesh.matrix.clone()
	const transform = new THREE.Vector3()
		.setFromMatrixPosition(matrix)
		.add(new THREE.Vector3(0, 8, 0))
		.multiply(new THREE.Vector3(1 / 16, 1 / 16, 1 / 16))
	matrix.setPosition(transform)
	return columnToRowMajor(matrix.toArray())
}

export interface IAnimationBone {
	name: string
	uuid: string
	group?: Group
	matrix: number[]
}

export function getAnimationBones() {
	const bones: IAnimationBone[] = []

	for (const group of Group.all) {
		bones.push({
			name: group.name,
			uuid: group.uuid,
			group: group,
			matrix: getGroupMatrixArray(group),
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
				condition: kf.data_points[0].condition,
			}
	}
}

function getCommandsKeyframe(animation: _Animation, time: number) {
	if (!animation.animators.effects?.commands) return
	for (const kf of animation.animators.effects.commands as _Keyframe[]) {
		if (kf.time === time)
			return {
				commands: kf.data_points[0].commands,
				condition: kf.data_points[0].condition,
			}
	}
}

function getAnimationStateKeyframe(animation: _Animation, time: number) {
	if (!animation.animators.effects?.animationStates) return
	for (const kf of animation.animators.effects.animationStates as _Keyframe[]) {
		if (kf.time === time)
			return {
				animation: kf.data_points[0].animationState,
				condition: kf.data_points[0].condition,
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

export interface IRenderedAnimation {
	name: string
	frames: Array<{
		bones: IAnimationBone[]
		variant?: {
			uuid: string
			condition: string
		}
		commands?: {
			commands: string
			condition: string
		}
		animationState?: {
			animation: string
			condition: string
		}
	}>
}

export async function renderAnimation(animation: _Animation) {
	const rendered = { name: animation.name, frames: [] } as IRenderedAnimation
	animation.select()

	const clock = new LimitClock(10)

	for (let time = 0; time <= animation.length; time = roundToN(time + 0.05, 20)) {
		// await new Promise(resolve => requestAnimationFrame(resolve))
		// await new Promise(resolve => setTimeout(resolve, 50))
		updatePreview(animation, time)
		rendered.frames.push({
			bones: getAnimationBones(),
			variant: getVariantKeyframe(animation, time),
			commands: getCommandsKeyframe(animation, time),
			animationState: getAnimationStateKeyframe(animation, time),
		})
		await clock.sync()
	}
	return rendered
}

export async function renderAllAnimations() {
	let selectedAnimation: _Animation | undefined
	let currentTime = 0
	progress = new ProgressBarController('Rendering Animations...', Animator.animations.length)
	// Save selected animation
	if (Mode.selected.id === 'animate') {
		selectedAnimation = Animator.selected
		currentTime = Timeline.time
	}

	const animations: IRenderedAnimation[] = []

	for (const animation of Animator.animations) {
		animations.push(await renderAnimation(animation))
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
