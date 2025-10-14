import { registerConditionalPropertyOverrideMod, registerProjectMod } from 'src/util/moddingTools'
import { activeProjectIsBlueprintFormat, BLUEPRINT_FORMAT_ID } from '../formats/blueprint'
import { translate } from '../util/translation'
import { Variant } from '../variants'

declare global {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface _Keyframe {
		variant?: Variant
		function?: string
		execute_condition?: string
		repeat?: boolean
		repeat_frequency?: number
	}
}

export enum LOCATOR_CHANNELS {
	FUNCTION = 'function',
}

export enum EFFECT_ANIMATOR_CHANNELS {
	VARIANT = 'variant',
	FUNCTION = 'function',
}

export enum KEYFRAME_DATA_POINTS {
	EXECUTE_CONDITION = 'execute_condition',
	REPEAT = 'repeat',
	REPEAT_FREQUENCY = 'repeat_frequency',
}

export function isCustomKeyframeChannel(channel: string) {
	return Object.values(EFFECT_ANIMATOR_CHANNELS).includes(channel as any)
}

registerConditionalPropertyOverrideMod({
	id: `animated-java:keyframe/data-point/variant`,
	object: Blockbench.Keyframe.prototype,
	key: EFFECT_ANIMATOR_CHANNELS.VARIANT,

	condition: () => activeProjectIsBlueprintFormat(),

	get(this: _Keyframe) {
		const uuid = this.data_points.at(0)?.[EFFECT_ANIMATOR_CHANNELS.VARIANT] as
			| string
			| undefined
		if (uuid) return Variant.getByUUID(uuid)
		console.error('Keyframe variant', uuid, 'not found!')
	},

	set(this: _Keyframe, value: Variant | undefined) {
		const dataPoint = this.data_points.at(0)
		if (dataPoint) dataPoint[EFFECT_ANIMATOR_CHANNELS.VARIANT] = value?.uuid
	},
})

registerConditionalPropertyOverrideMod({
	id: `animated-java:keyframe/data-point/function`,
	object: Blockbench.Keyframe.prototype,
	key: EFFECT_ANIMATOR_CHANNELS.FUNCTION,

	condition: () => activeProjectIsBlueprintFormat(),

	get(this: _Keyframe) {
		return this.data_points.at(0)?.[EFFECT_ANIMATOR_CHANNELS.FUNCTION] ?? ''
	},

	set(this: _Keyframe, value: string) {
		const dataPoint = this.data_points.at(0)
		if (dataPoint) dataPoint[EFFECT_ANIMATOR_CHANNELS.FUNCTION] = value
	},
})

registerConditionalPropertyOverrideMod({
	id: `animated-java:keyframe/data-point/execute-condition`,
	object: Blockbench.Keyframe.prototype,
	key: KEYFRAME_DATA_POINTS.EXECUTE_CONDITION,

	condition: () => activeProjectIsBlueprintFormat(),

	get(this: _Keyframe) {
		return this.data_points.at(0)?.[KEYFRAME_DATA_POINTS.EXECUTE_CONDITION] ?? ''
	},

	set(this: _Keyframe, value: string) {
		const dataPoint = this.data_points.at(0)
		if (dataPoint) dataPoint[KEYFRAME_DATA_POINTS.EXECUTE_CONDITION] = value
	},
})

registerConditionalPropertyOverrideMod({
	id: `animated-java:keyframe/data-point/repeat`,
	object: Blockbench.Keyframe.prototype,
	key: KEYFRAME_DATA_POINTS.REPEAT,

	condition: () => activeProjectIsBlueprintFormat(),

	get(this: _Keyframe) {
		return this.data_points.at(0)?.[KEYFRAME_DATA_POINTS.REPEAT] ?? false
	},

	set(this: _Keyframe, value: boolean) {
		const dataPoint = this.data_points.at(0)
		if (dataPoint) dataPoint[KEYFRAME_DATA_POINTS.REPEAT] = value
	},
})

registerConditionalPropertyOverrideMod({
	id: `animated-java:keyframe/data-point/repeat-frequency`,
	object: Blockbench.Keyframe.prototype,
	key: KEYFRAME_DATA_POINTS.REPEAT_FREQUENCY,

	condition: () => activeProjectIsBlueprintFormat(),

	get(this: _Keyframe) {
		return this.data_points.at(0)?.[KEYFRAME_DATA_POINTS.REPEAT_FREQUENCY] ?? 1
	},

	set(this: _Keyframe, value: number) {
		const dataPoint = this.data_points.at(0)
		if (dataPoint) dataPoint[KEYFRAME_DATA_POINTS.REPEAT_FREQUENCY] = value
	},
})

registerProjectMod({
	id: 'animated-java:custom-keyframes',

	condition: project => project.format.id === BLUEPRINT_FORMAT_ID,

	apply: () => {
		const defaultChannels = { ...EffectAnimator.prototype.channels }

		// Add custom keyframe channels
		EffectAnimator.addChannel(EFFECT_ANIMATOR_CHANNELS.VARIANT, {
			name: translate('effect_animator.timeline.variant'),
			mutable: true,
			max_data_points: 1,
		})
		EffectAnimator.addChannel(EFFECT_ANIMATOR_CHANNELS.FUNCTION, {
			name: translate('effect_animator.timeline.function'),
			mutable: true,
			max_data_points: 1,
		})

		// Add custom keyframe properties to the KeyframeDataPoint class
		const properties = [
			new Property(KeyframeDataPoint, 'string', EFFECT_ANIMATOR_CHANNELS.VARIANT, {
				label: translate('effect_animator.keyframe_data_point.variant'),
				condition: datapoint =>
					datapoint.keyframe.channel === EFFECT_ANIMATOR_CHANNELS.VARIANT,
				exposed: false,
				default: () => Variant.getDefault().uuid,
			}),

			new Property(KeyframeDataPoint, 'string', EFFECT_ANIMATOR_CHANNELS.FUNCTION, {
				label: translate('effect_animator.keyframe_data_point.function'),
				default: '',
				condition: datapoint =>
					datapoint.keyframe.channel === EFFECT_ANIMATOR_CHANNELS.FUNCTION,
				exposed: false,
			}),

			new Property(KeyframeDataPoint, 'string', KEYFRAME_DATA_POINTS.EXECUTE_CONDITION, {
				label: translate('effect_animator.keyframe_data_point.execute_condition'),
				default: '',
				condition: datapoint => isCustomKeyframeChannel(datapoint.keyframe.channel),
				exposed: false,
			}),

			new Property(KeyframeDataPoint, 'boolean', KEYFRAME_DATA_POINTS.REPEAT, {
				label: translate('effect_animator.keyframe_data_point.repeat'),
				default: false,
				condition: datapoint =>
					datapoint.keyframe.channel === EFFECT_ANIMATOR_CHANNELS.FUNCTION,
				exposed: false,
			}),

			new Property(KeyframeDataPoint, 'number', KEYFRAME_DATA_POINTS.REPEAT_FREQUENCY, {
				label: translate('effect_animator.keyframe_data_point.repeat_frequency'),
				default: 1,
				condition: datapoint =>
					datapoint.keyframe.channel === EFFECT_ANIMATOR_CHANNELS.FUNCTION,
				exposed: false,
			}),
		]

		// Remove default keyframe channels (except sound)
		for (const channel of Object.keys(defaultChannels)) {
			if (channel === 'sound') continue
			delete EffectAnimator.prototype.channels[channel]
		}

		// Modify the displayFrame method to handle custom keyframes
		const defaultEffectDisplayFrame = EffectAnimator.prototype.displayFrame
		EffectAnimator.prototype.displayFrame = function (this: EffectAnimator, inLoop: boolean) {
			this.muted.particle = true
			this.muted.timeline = true
			// Default Blockbench Sound keyframe handling
			defaultEffectDisplayFrame.call(this, inLoop)

			if (!(Project && activeProjectIsBlueprintFormat())) return
			if (!this.muted[EFFECT_ANIMATOR_CHANNELS.VARIANT]) {
				let after, before, result: _Keyframe | undefined

				for (const kf of this[EFFECT_ANIMATOR_CHANNELS.VARIANT] as _Keyframe[]) {
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
					result = this[EFFECT_ANIMATOR_CHANNELS.VARIANT].at(-1)
				}

				result?.variant?.select()
			}

			this.last_displayed_time = this.animation.time
		}

		return { defaultChannels, defaultEffectDisplayFrame, properties }
	},

	revert: ({ defaultChannels, defaultEffectDisplayFrame, properties }) => {
		for (const channel of Object.keys(defaultChannels)) {
			if (channel === 'sound') continue // AJ doesn't modify the sound channel
			EffectAnimator.prototype.channels[channel] = defaultChannels[channel]
		}

		for (const prop of properties) {
			KeyframeDataPoint.properties[prop.name]?.delete()
		}

		for (const channel of Object.values(EFFECT_ANIMATOR_CHANNELS)) {
			delete EffectAnimator.prototype.channels[channel]
		}

		delete BoneAnimator.prototype.channels.commands
		delete BoneAnimator.prototype.commands

		EffectAnimator.prototype.displayFrame = defaultEffectDisplayFrame
	},
})
