import { format as modelFormat } from '../modelFormat'
import { bus } from '../util/bus'
import * as EVENTS from '../constants/events'
import { roundToN } from '../util/misc'

const originalDisplayFrame = BoneAnimator.prototype.displayFrame
BoneAnimator.prototype.displayFrame = (animator, multiplier = 1) => {
	if (!animator.doRender()) return
	animator.getGroup()

	let time = Timeline.time
	Timeline.time = roundToN(
		time,
		ANIMATED_JAVA.settings.animatedJava.animatorPreviewFps
	)
	if (!animator.muted.rotation)
		animator.displayRotation(animator.interpolate('rotation'), multiplier)
	if (!animator.muted.scale)
		animator.displayScale(animator.interpolate('scale'), multiplier)
	Timeline.time = time

	if (!animator.muted.position)
		animator.displayPosition(animator.interpolate('position'), multiplier)
}

function newPreview(in_loop) {
	// Bones
	Animator.showDefaultPose(true)
	;[...Group.all, ...NullObject.all].forEach((node) => {
		Animator.resetLastValues()
		Animator.animations.forEach((animation) => {
			let multiplier = animation.blend_weight
				? Math.clamp(
						Animator.MolangParser.parse(animation.blend_weight),
						0,
						Infinity
				  )
				: 1
			if (animation.playing) {
				const animator = animation.getBoneAnimator(node)
				animator.displayFrame(animator, multiplier)
			}
		})
	})
	Animator.resetLastValues()
	scene.updateMatrixWorld()

	// Effects
	Animator.resetParticles(true)
	Animator.animations.forEach((animation) => {
		if (animation.playing) {
			if (animation.animators.effects) {
				animation.animators.effects.displayFrame(in_loop)
			}
		}
	})

	if (Group.selected || NullObject.selected[0]) {
		Transformer.updateSelection()
	}
	Blockbench.dispatchEvent('display_animation_frame')
}

const originalPreview = Animator.preview
Animator.preview = (...args) => {
	if (Project.format.id === modelFormat.id) {
		newPreview(...args)
	} else {
		originalPreview(...args)
	}
}

bus.on(EVENTS.LIFECYCLE.CLEANUP, () => {
	Animator.preview = originalPreview
	BoneAnimator.prototype.displayFrame = originalDisplayFrame
})
