import { format as modelFormat } from '../modelFormat'
import { bus } from '../util/bus'
import * as EVENTS from '../constants/events'
import { roundToN } from '../util/misc'

function interpolate(animator, channel, allow_expression, axis) {
	let time = Timeline.time
	var before = false
	var after = false
	var result = false
	let epsilon = 1 / 1200

	function mapAxes(cb) {
		if (axis) {
			let result = cb(axis)
			Animator._last_values[channel][axis] = result
			return result
		} else {
			return ['x', 'y', 'z'].map((axis) => {
				let result = cb(axis)
				Animator._last_values[channel][axis] = result
				return result
			})
		}
	}

	for (var keyframe of animator[channel]) {
		if (keyframe.time < time) {
			if (!before || keyframe.time > before.time) {
				before = keyframe
			}
		} else {
			if (!after || keyframe.time < after.time) {
				after = keyframe
			}
		}
		i++
	}
	if (before && Math.epsilon(before.time, time, epsilon)) {
		result = before
	} else if (after && Math.epsilon(after.time, time, epsilon)) {
		result = after
	} else if (before && before.interpolation == Keyframe.interpolation.step) {
		result = before
	} else if (before && !after) {
		result = before
	} else if (after && !before) {
		result = after
	} else if (!before && !after) {
		//
	} else {
		let no_interpolations = Blockbench.hasFlag('no_interpolations')
		let alpha = Math.getLerp(before.time, after.time, time)

		if (
			no_interpolations ||
			(before.interpolation !== Keyframe.interpolation.catmullrom &&
				after.interpolation !== Keyframe.interpolation.catmullrom)
		) {
			if (no_interpolations) {
				alpha = Math.round(alpha)
			}
			return mapAxes((axis) =>
				before.getLerp(after, axis, alpha, allow_expression)
			)
		} else {
			let sorted = animator[channel]
				.slice()
				.sort((kf1, kf2) => kf1.time - kf2.time)
			let before_index = sorted.indexOf(before)
			let before_plus = sorted[before_index - 1]
			let after_plus = sorted[before_index + 2]

			return mapAxes((axis) =>
				before.getCatmullromLerp(
					before_plus,
					before,
					after,
					after_plus,
					axis,
					alpha
				)
			)
		}
	}
	if (result && result instanceof Keyframe) {
		let keyframe = result
		let method = allow_expression ? 'get' : 'calc'
		let dp_index =
			keyframe.time > time || Math.epsilon(keyframe.time, time, epsilon)
				? 0
				: keyframe.data_points.length - 1

		return mapAxes((axis) => keyframe[method](axis, dp_index))
	}
	return false
}

const originalDisplayFrame = BoneAnimator.prototype.displayFrame
BoneAnimator.prototype.displayFrame = (animator, multiplier = 1) => {
	if (!animator.doRender) return
	animator.getGroup()

	let time = Timeline.time
	if (Timeline.playing) {
		Timeline.time = roundToN(
			time,
			ANIMATED_JAVA.settings.animatedJava.animatorPreviewFps
		)
	}
	if (!animator.muted.rotation)
		animator.displayRotation(interpolate(animator, 'rotation'), multiplier)
	if (!animator.muted.scale)
		animator.displayScale(interpolate(animator, 'scale'), multiplier)
	if (Timeline.playing) Timeline.time = time

	if (!animator.muted.position)
		animator.displayPosition(interpolate(animator, 'position'), multiplier)
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
