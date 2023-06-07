import { ajModelFormat } from '../modelFormat'
import * as events from '../events'
import { translate } from '../util/translation'
// import { applyModelVariant } from '../variants'

const oldEffectAnimatorDisplayFrame = EffectAnimator.prototype.displayFrame
// const oldEffectAnimatorStartPreviousSounds = EffectAnimator.prototype.startPreviousSounds
const OLD_CHANNELS = { ...EffectAnimator.prototype.channels }

let installed = false

export function injectCustomKeyframes() {
	if (installed) return
	// Add custom channels to Bone Animator
	// BoneAnimator.addChannel('commands', {
	// 	name: translate('animated_java.timeline.commands'),
	// 	mutable: false,
	// 	max_data_points: 2,
	// })

	// Add custom channels to Effect Animator
	// EffectAnimator.addChannel('animationStates', {
	// 	name: translate('animated_java.timeline.animation'),
	// 	mutable: false,
	// 	max_data_points: 2,
	// })

	EffectAnimator.addChannel('variants', {
		name: translate('animated_java.timeline.variant'),
		mutable: true,
		max_data_points: 2,
	})

	EffectAnimator.addChannel('commands', {
		name: translate('animated_java.timeline.commands'),
		mutable: false,
		max_data_points: 2,
	})

	// Add new KeyframeDataPoint properties
	new Property(KeyframeDataPoint, 'string', 'variant', {
		label: translate('animated_java.keyframe.variant'),
		default: 'default',
		condition: point => {
			return point.keyframe.channel === 'variants'
		},
		exposed: false,
	})

	new Property(KeyframeDataPoint, 'string', 'commands', {
		label: translate('animated_java.keyframe.commands'),
		condition: point => {
			return point.keyframe.channel === 'commands'
		},
		exposed: false,
	})

	// new Property(KeyframeDataPoint, 'string', 'animationState', {
	// 	label: translate('animated_java.keyframe.animationState'),
	// 	condition: point => {
	// 		return point.keyframe.channel === 'animationStates'
	// 	},
	// 	exposed: false,
	// })

	new Property(KeyframeDataPoint, 'string', 'executeCondition', {
		label: translate('animated_java.keyframe.executeCondition'),
		condition: point => {
			return ['animationStates', 'variants', 'commands'].includes(
				point.keyframe.channel as string
			)
		},
		exposed: false,
	})

	for (const channel of Object.keys(OLD_CHANNELS)) {
		if (channel === 'sound') continue
		delete EffectAnimator.prototype.channels[channel]
	}

	// Modify keyframe functionality
	EffectAnimator.prototype.displayFrame = function (this: EffectAnimator, inLoop: boolean) {
		// Default Blockbench Sound keyframe handling
		if (inLoop && !this.muted.sound) {
			this.sound.forEach((kf: _Keyframe) => {
				const diff = kf.time - this.animation.time
				if (diff >= 0 && diff < (1 / 60) * (Timeline.playback_speed / 100)) {
					if (kf.data_points[0].file && !kf.cooldown) {
						const media = new Audio(kf.data_points[0].file as string)
						media.playbackRate = Math.clamp(Timeline.playback_speed / 100, 0.1, 4.0)
						media.volume = Math.clamp(settings.volume.value / 100, 0, 1)
						media.play().catch(() => null)
						Timeline.playing_sounds.push(media)
						media.onended = function () {
							Timeline.playing_sounds.remove(media)
						}
						kf.cooldown = true
						setTimeout(() => {
							delete kf.cooldown
						}, 400)
					}
				}
			})
		}

		if (!Project || !Project.animated_java_variants) return
		if (!this.muted.variants) {
			let after, before, result: _Keyframe | undefined

			for (const kf of this.variants as _Keyframe[]) {
				if (kf.time < this.animation.time) {
					if (!before || kf.time > before.time) {
						before = kf
					}
				} else {
					if (!after || kf.time < after.time) {
						after = kf
					}
				}
			}

			if (after && after.time === this.animation.time) {
				result = after
			} else if (before) {
				result = before
			} else if (after) {
				result = this.variants.at(-1)
			}

			if (result) {
				const variant = Project.animated_java_variants.variants.find(
					v => result && v.uuid === result.data_points[0].variant
				)
				Project.animated_java_variants.select(variant)
			}
		}

		this.last_displayed_time = this.animation.time
	}

	// EffectAnimator.prototype.startPreviousSounds = function (this: EffectAnimator) {
	// 	// Do nothing. Blockbench throws an error if this isn't overwritten.
	// }

	installed = true
}

export function extractCustomKeyframes() {
	if (!installed) return
	EffectAnimator.prototype.displayFrame = oldEffectAnimatorDisplayFrame
	// EffectAnimator.prototype.startPreviousSounds = oldEffectAnimatorStartPreviousSounds

	for (const channel of Object.keys(OLD_CHANNELS)) {
		if (channel === 'sound') continue
		EffectAnimator.prototype.channels[channel] = OLD_CHANNELS[channel]
	}

	KeyframeDataPoint.properties.variant?.delete()
	KeyframeDataPoint.properties.commands?.delete()
	// KeyframeDataPoint.properties.animationState?.delete()
	KeyframeDataPoint.properties.executeCondition?.delete()

	// delete BoneAnimator.prototype.channels.commands
	// delete BoneAnimator.prototype.commands

	delete EffectAnimator.prototype.channels.variants
	delete EffectAnimator.prototype.variants
	delete EffectAnimator.prototype.channels.commands
	delete EffectAnimator.prototype.commands
	// delete EffectAnimator.prototype.channels.animationStates
	// delete EffectAnimator.prototype.animationStates

	installed = false
}

events.EXTRACT_MODS.subscribe(() => extractCustomKeyframes())

events.PRE_SELECT_PROJECT.subscribe(project => {
	if (project.format.id === ajModelFormat.id) {
		if (!installed) injectCustomKeyframes()
	} else {
		if (installed) extractCustomKeyframes()
	}
})

function keyframeSetterFactory(channel: string) {
	return function (kf: _Keyframe, data: any) {
		const dataPoint = kf.data_points.at(0)
		if (dataPoint) dataPoint[channel] = data
	}
}

function keyframeGetterFactory(channel: string) {
	return function (kf: _Keyframe) {
		return kf.data_points.at(0)?.[channel] as string | undefined
	}
}

export const getKeyframeVariant = keyframeGetterFactory('variant')
export const setKeyframeVariant = keyframeSetterFactory('variant')
export const getKeyframeCommands = keyframeGetterFactory('commands')
export const setKeyframeCommands = keyframeSetterFactory('commands')
// export const getKeyframeAnimationState = keyframeGetterFactory('animationState')
// export const setKeyframeAnimationState = keyframeSetterFactory('animationState')
export const getKeyframeCondition = keyframeGetterFactory('executeCondition')
export const setKeyframeCondition = keyframeSetterFactory('executeCondition')
