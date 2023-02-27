import { events } from './util/events'
import { roundTo, roundToN } from './util/misc'
import { BlockbenchMod } from './util/mods'
import { translate } from './util/translation'

const oldEffectAnimatorDisplayFrame = EffectAnimator.prototype.displayFrame
const oldChannels: any = {
	particle: { ...EffectAnimator.prototype.channels.particle },
	sound: { ...EffectAnimator.prototype.channels.sound },
	timeline: { ...EffectAnimator.prototype.channels.timeline },
}

// FIXME - This mod should only apply while an animated java project is selected
const effectAnimatorDisplayFrame = new BlockbenchMod({
	id: 'animated_java:effect_animator_display_frame',
	inject() {
		// Add custom channels
		EffectAnimator.addChannel('states', {
			name: translate('animated_java.timeline.state'),
			mutable: false,
			max_data_points: 1,
		})

		EffectAnimator.addChannel('variants', {
			name: translate('animated_java.timeline.variant'),
			mutable: true,
			max_data_points: 1,
		})

		EffectAnimator.addChannel('functions', {
			name: translate('animated_java.timeline.function'),
			mutable: false,
			max_data_points: 1,
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

		new Property(KeyframeDataPoint, 'string', 'function', {
			label: translate('animated_java.keyframe.function'),
			condition: point => {
				return point.keyframe.channel === 'functions'
			},
			exposed: false,
		})

		new Property(KeyframeDataPoint, 'string', 'state', {
			label: translate('animated_java.keyframe.state'),
			condition: point => {
				return point.keyframe.channel === 'states'
			},
			exposed: false,
		})

		for (const channel of Object.keys(oldChannels)) {
			delete EffectAnimator.prototype.channels[channel]
		}

		// Modify keyframe functionality
		EffectAnimator.prototype.displayFrame = function (this: EffectAnimator, in_loop: boolean) {
			if (!this.muted.variants) {
				for (const kf of this.variants) {
					if (roundToN(this.last_displayed_time, 20) === kf.time) {
						console.log('[Insert Variant Display Function Here]', kf)
					}
				}
			}

			this.last_displayed_time = this.animation.time
		}
	},
	extract() {
		EffectAnimator.prototype.displayFrame = oldEffectAnimatorDisplayFrame

		for (const channel of Object.keys(oldChannels)) {
			EffectAnimator.prototype.channels[channel] = oldChannels[channel]
		}

		KeyframeDataPoint.properties.variant?.delete()
		KeyframeDataPoint.properties.function?.delete()

		delete EffectAnimator.prototype.channels.variants
		delete EffectAnimator.prototype.variants
		delete EffectAnimator.prototype.channels.functions
		delete EffectAnimator.prototype.functions
		delete EffectAnimator.prototype.channels.states
		delete EffectAnimator.prototype.states
	},
})
