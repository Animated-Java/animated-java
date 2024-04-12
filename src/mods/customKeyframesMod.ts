import { BLUEPRINT_FORMAT, isCurrentFormat } from '../blueprintFormat'
import { PACKAGE } from '../constants'
import { events } from '../util/events'
import { createBlockbenchMod } from '../util/moddingTools'
import { translate } from '../util/translation'
import { Variant } from '../variants'

const DEFAULT_CHANNELS = { ...EffectAnimator.prototype.channels }
const DEFAULT_DISPLAY_FRAME = EffectAnimator.prototype.displayFrame
export const CUSTOM_CHANNELS = ['variant', 'commands']

let installed = false

function injectCustomKeyframes() {
	if (installed) return

	// Add custom keyframe channels
	EffectAnimator.addChannel('variant', {
		name: translate('effect_animator.timeline.variant'),
		mutable: true,
		max_data_points: 1,
	})
	EffectAnimator.addChannel('commands', {
		name: translate('effect_animator.timeline.commands'),
		mutable: true,
		max_data_points: 1,
	})

	// Add custom keyframe properties to the KeyframeDataPoint class
	new Property(KeyframeDataPoint, 'string', 'variant', {
		label: translate('effect_animator.keyframe.variant'),
		default: 'default',
		condition: datapoint => datapoint.keyframe.channel === 'variant',
		exposed: false,
	})
	new Property(KeyframeDataPoint, 'string', 'commands', {
		label: translate('effect_animator.keyframe.commands'),
		default: 'default',
		condition: datapoint => datapoint.keyframe.channel === 'commands',
		exposed: false,
	})
	new Property(KeyframeDataPoint, 'string', 'execute_condition', {
		label: translate('effect_animator.keyframe.execute_condition'),
		default: 'default',
		condition: datapoint =>
			['variant', 'commands'].includes(datapoint.keyframe.channel as string),
		exposed: false,
	})

	// Remove default keyframe channels (except sound)
	for (const channel of Object.keys(DEFAULT_CHANNELS)) {
		if (channel === 'sound') continue
		delete EffectAnimator.prototype.channels[channel]
	}

	// Modify the displayFrame method to handle custom keyframes
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

		if (!(Project && isCurrentFormat())) return
		if (!this.muted.variant) {
			let after, before, result: _Keyframe | undefined

			for (const kf of this.variant as _Keyframe[]) {
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
				result = this.variant.at(-1)
			}

			if (result) {
				const variant = Variant.all.find(v => v.uuid === result.data_points[0].variant)
				if (!variant) console.error('Variant', result.data_points[0].variant, 'not found.')
				variant?.select()
			}
		}

		this.last_displayed_time = this.animation.time
	}

	installed = true
}

function extractCustomKeyframes() {
	if (!installed) return

	for (const channel of Object.keys(DEFAULT_CHANNELS)) {
		if (channel === 'sound') continue
		EffectAnimator.prototype.channels[channel] = DEFAULT_CHANNELS[channel]
	}

	KeyframeDataPoint.properties.variant?.delete()
	KeyframeDataPoint.properties.commands?.delete()
	KeyframeDataPoint.properties.execute_condition?.delete()

	delete EffectAnimator.prototype.channels.variant
	delete EffectAnimator.prototype.variant
	delete EffectAnimator.prototype.channels.commands
	delete EffectAnimator.prototype.commands

	EffectAnimator.prototype.displayFrame = DEFAULT_DISPLAY_FRAME

	installed = false
}

createBlockbenchMod(
	`${PACKAGE.name}:customKeyframes`,
	undefined,
	() => {
		injectCustomKeyframes()
	},
	() => {
		extractCustomKeyframes()
	}
)

events.PRE_SELECT_PROJECT.subscribe(project => {
	if (project.format.id === BLUEPRINT_FORMAT.id) {
		injectCustomKeyframes()
	} else {
		extractCustomKeyframes()
	}
})

function keyframeValueSetterFactory<ValueType>(channel: string) {
	return function (kf: _Keyframe, value: ValueType) {
		if (kf.data_points.length === 0) {
			kf.data_points.push(new KeyframeDataPoint(kf))
		}
		kf.data_points[0][channel] = value
	}
}

function keyframeValueGetterFactory<ValueType>(channel: string) {
	return function (kf: _Keyframe) {
		return kf.data_points.at(0)?.[channel] as ValueType | undefined
	}
}

export const setKeyframeVariant = keyframeValueSetterFactory<string>('variant')
export const getKeyframeVariant = keyframeValueGetterFactory<string>('variant')
export const setKeyframeCommands = keyframeValueSetterFactory<string>('commands')
export const getKeyframeCommands = keyframeValueGetterFactory<string>('commands')
export const setKeyframeExecuteCondition = keyframeValueSetterFactory<string>('execute_condition')
export const getKeyframeExecuteCondition = keyframeValueGetterFactory<string>('execute_condition')
