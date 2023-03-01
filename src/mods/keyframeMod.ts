import { ajModelFormat } from '../modelFormat'
import * as events from '../util/events'
import { createBlockbenchMod } from '../util/mods'
import { translate } from '../util/translation'
import { applyModelVariant } from '../variants'

const oldEffectAnimatorDisplayFrame = EffectAnimator.prototype.displayFrame
const oldEffectAnimatorStartPreviousSounds = EffectAnimator.prototype.startPreviousSounds
const oldChannels: any = {
	particle: { ...EffectAnimator.prototype.channels.particle },
	sound: { ...EffectAnimator.prototype.channels.sound },
	timeline: { ...EffectAnimator.prototype.channels.timeline },
}

let installed = false

export function injectCustomKeyframes() {
	// Add custom channels
	EffectAnimator.addChannel('animationStates', {
		name: translate('animated_java.timeline.animationState'),
		mutable: false,
		max_data_points: 1,
	})

	EffectAnimator.addChannel('variants', {
		name: translate('animated_java.timeline.variant'),
		mutable: true,
		max_data_points: 1,
	})

	EffectAnimator.addChannel('commands', {
		name: translate('animated_java.timeline.commands'),
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

	new Property(KeyframeDataPoint, 'string', 'commands', {
		label: translate('animated_java.keyframe.commands'),
		condition: point => {
			return point.keyframe.channel === 'commands'
		},
		exposed: false,
	})

	new Property(KeyframeDataPoint, 'string', 'animationState', {
		label: translate('animated_java.keyframe.animationState'),
		condition: point => {
			return point.keyframe.channel === 'animationStates'
		},
		exposed: false,
	})

	new Property(KeyframeDataPoint, 'string', 'condition', {
		label: translate('animated_java.keyframe.condition'),
		condition: point => {
			return ['animationStates', 'variants'].includes(point.keyframe.channel)
		},
		exposed: false,
	})

	for (const channel of Object.keys(oldChannels)) {
		delete EffectAnimator.prototype.channels[channel]
	}

	// Modify keyframe functionality
	EffectAnimator.prototype.displayFrame = function (this: EffectAnimator, in_loop: boolean) {
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
				const variant = Project!.animated_java_variants!.variants.find(
					v => v.uuid === result!.data_points[0].variant
				)
				if (variant) applyModelVariant(variant)
			}
		}

		this.last_displayed_time = this.animation.time
	}

	EffectAnimator.prototype.startPreviousSounds = function (this: EffectAnimator) {}

	installed = true
}

export function extractCustomKeyframes() {
	EffectAnimator.prototype.displayFrame = oldEffectAnimatorDisplayFrame
	EffectAnimator.prototype.startPreviousSounds = oldEffectAnimatorStartPreviousSounds

	for (const channel of Object.keys(oldChannels)) {
		EffectAnimator.prototype.channels[channel] = oldChannels[channel]
	}

	KeyframeDataPoint.properties.variant?.delete()
	KeyframeDataPoint.properties.commands?.delete()
	KeyframeDataPoint.properties.animationState?.delete()
	KeyframeDataPoint.properties.condition?.delete()

	delete EffectAnimator.prototype.channels.variants
	delete EffectAnimator.prototype.variants
	delete EffectAnimator.prototype.channels.commands
	delete EffectAnimator.prototype.commands
	delete EffectAnimator.prototype.channels.animationStates
	delete EffectAnimator.prototype.animationStates

	installed = false
}

events.extractMods.subscribe(() => extractCustomKeyframes())

events.preSelectProject.subscribe(project => {
	if (project.format.id === ajModelFormat.id) {
		if (!installed) injectCustomKeyframes()
	} else {
		if (installed) extractCustomKeyframes()
	}
})

export function getKeyframeVariant(kf: _Keyframe): string | undefined {
	return kf.data_points.at(0)?.variant
}

export function setKeyframeVariant(kf: _Keyframe, variant: string | undefined) {
	kf.data_points.at(0)!.variant = variant
}

export function getKeyframeCommands(kf: _Keyframe): string | undefined {
	return kf.data_points.at(0)?.commands
}

export function setKeyframeCommands(kf: _Keyframe, commands: string) {
	kf.data_points.at(0)!.commands = commands
}

export function getKeyframeAnimationState(kf: _Keyframe): string | undefined {
	return kf.data_points.at(0)?.animationState
}

export function setKeyframeAnimationState(kf: _Keyframe, animationState: string) {
	kf.data_points.at(0)!.animationState = animationState
}

export function getKeyframeCondition(kf: _Keyframe): string | undefined {
	return kf.data_points.at(0)?.condition
}

export function setKeyframeCondition(kf: _Keyframe, condition: string) {
	kf.data_points.at(0)!.condition = condition
}
