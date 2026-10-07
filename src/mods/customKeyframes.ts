import { registerProjectPatch, registerPropertyOverridePatch } from 'blockbench-patch-manager'
import { activeProjectIsBlueprintFormat, BLUEPRINT_FORMAT_ID } from '../formats/blueprint'
import { localize as translate } from '../util/lang'
import { Variant } from '../variants'

declare global {
	// @ts-expect-error - Broken BB types
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface _Keyframe {
		/** Variants to apply, in order. */
		variants?: Variant[]
		/** Slot UUID -> texture UUID. Slots left out are unchanged. */
		texture_slots?: Record<string, string>
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
	TEXTURE_SLOT = 'texture_slot',
	FUNCTION = 'function',
}

export enum KEYFRAME_DATA_POINTS {
	VARIANTS = 'variants',
	TEXTURE_SLOTS = 'texture_slots',
	EXECUTE_CONDITION = 'execute_condition',
	REPEAT = 'repeat',
	REPEAT_FREQUENCY = 'repeat_frequency',
}

export function isCustomKeyframeChannel(channel: string) {
	return Object.values(EFFECT_ANIMATOR_CHANNELS).includes(channel as any)
}

registerPropertyOverridePatch({
	id: `animated_java:keyframe/data-point/variants`,
	target: Blockbench.Keyframe.prototype,
	key: KEYFRAME_DATA_POINTS.VARIANTS,

	condition: () => activeProjectIsBlueprintFormat(),

	get(this: _Keyframe) {
		const uuids = (this.data_points.at(0)?.[KEYFRAME_DATA_POINTS.VARIANTS] ?? []) as string[]
		return uuids.map(uuid => Variant.getByUUID(uuid)).filter((v): v is Variant => !!v)
	},

	set(this: _Keyframe, value: Variant[]) {
		const dataPoint = this.data_points.at(0)
		if (dataPoint) {
			dataPoint[KEYFRAME_DATA_POINTS.VARIANTS] = value.map(variant => variant.uuid)
			return value
		}
		return undefined!
	},
})

registerPropertyOverridePatch({
	id: `animated_java:keyframe/data-point/texture-slots`,
	target: Blockbench.Keyframe.prototype,
	key: KEYFRAME_DATA_POINTS.TEXTURE_SLOTS,

	condition: () => activeProjectIsBlueprintFormat(),

	get(this: _Keyframe) {
		return (this.data_points.at(0)?.[KEYFRAME_DATA_POINTS.TEXTURE_SLOTS] ?? {}) as Record<
			string,
			string
		>
	},

	set(this: _Keyframe, value: Record<string, string>) {
		const dataPoint = this.data_points.at(0)
		if (dataPoint) {
			dataPoint[KEYFRAME_DATA_POINTS.TEXTURE_SLOTS] = { ...value }
			return value
		}
		return undefined!
	},
})

registerPropertyOverridePatch({
	id: `animated_java:keyframe/data-point/function`,
	target: Blockbench.Keyframe.prototype,
	key: EFFECT_ANIMATOR_CHANNELS.FUNCTION,

	condition: () => activeProjectIsBlueprintFormat(),

	get(this: _Keyframe) {
		return this.data_points.at(0)?.[EFFECT_ANIMATOR_CHANNELS.FUNCTION] ?? ''
	},

	set(this: _Keyframe, value: string) {
		const dataPoint = this.data_points.at(0)
		if (dataPoint) {
			dataPoint[EFFECT_ANIMATOR_CHANNELS.FUNCTION] = value
			return value
		}
		return undefined!
	},
})

registerPropertyOverridePatch({
	id: `animated_java:keyframe/data-point/execute-condition`,
	target: Blockbench.Keyframe.prototype,
	key: KEYFRAME_DATA_POINTS.EXECUTE_CONDITION,

	condition: () => activeProjectIsBlueprintFormat(),

	get(this: _Keyframe) {
		return this.data_points.at(0)?.[KEYFRAME_DATA_POINTS.EXECUTE_CONDITION] ?? ''
	},

	set(this: _Keyframe, value: string) {
		const dataPoint = this.data_points.at(0)
		if (dataPoint) {
			dataPoint[KEYFRAME_DATA_POINTS.EXECUTE_CONDITION] = value
			return value
		}
		return undefined!
	},
})

registerPropertyOverridePatch({
	id: `animated_java:keyframe/data-point/repeat`,
	target: Blockbench.Keyframe.prototype,
	key: KEYFRAME_DATA_POINTS.REPEAT,

	condition: () => activeProjectIsBlueprintFormat(),

	get(this: _Keyframe) {
		return this.data_points.at(0)?.[KEYFRAME_DATA_POINTS.REPEAT] ?? false
	},

	set(this: _Keyframe, value: boolean) {
		const dataPoint = this.data_points.at(0)
		if (dataPoint) {
			dataPoint[KEYFRAME_DATA_POINTS.REPEAT] = value
			return value
		}
		return undefined!
	},
})

registerPropertyOverridePatch({
	id: `animated_java:keyframe/data-point/repeat-frequency`,
	target: Blockbench.Keyframe.prototype,
	key: KEYFRAME_DATA_POINTS.REPEAT_FREQUENCY,

	condition: () => activeProjectIsBlueprintFormat(),

	get(this: _Keyframe) {
		return this.data_points.at(0)?.[KEYFRAME_DATA_POINTS.REPEAT_FREQUENCY] ?? 1
	},

	set(this: _Keyframe, value: number) {
		const dataPoint = this.data_points.at(0)
		if (dataPoint) {
			dataPoint[KEYFRAME_DATA_POINTS.REPEAT_FREQUENCY] = value
			return value
		}
		return undefined!
	},
})

registerProjectPatch({
	id: 'animated_java:custom-keyframes',

	condition: ({ project }) => project.format.id === BLUEPRINT_FORMAT_ID,

	apply: () => {
		const defaultChannels = { ...EffectAnimator.prototype.channels }

		// Add custom keyframe channels
		EffectAnimator.addChannel(EFFECT_ANIMATOR_CHANNELS.VARIANT, {
			name: translate('effect_animator.timeline.variant'),
			mutable: true,
			max_data_points: 1,
		})
		EffectAnimator.addChannel(EFFECT_ANIMATOR_CHANNELS.TEXTURE_SLOT, {
			name: translate('effect_animator.timeline.texture_slot'),
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
			new Property(KeyframeDataPoint, 'array', KEYFRAME_DATA_POINTS.VARIANTS, {
				label: translate('effect_animator.keyframe_data_point.variant'),
				condition: datapoint =>
					datapoint.keyframe.channel === EFFECT_ANIMATOR_CHANNELS.VARIANT,
				exposed: false,
				default: () => [Variant.getDefault().uuid],
			}),

			new Property(KeyframeDataPoint, 'object', KEYFRAME_DATA_POINTS.TEXTURE_SLOTS, {
				label: translate('effect_animator.keyframe_data_point.texture_slots'),
				condition: datapoint =>
					datapoint.keyframe.channel === EFFECT_ANIMATOR_CHANNELS.TEXTURE_SLOT,
				exposed: false,
				default: {},
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

		// Only keep Blockbench's sound keyframe handling. Variant and texture slot keyframes are
		// previewed by `updateAnimationPreview`.
		const defaultEffectDisplayFrame = EffectAnimator.prototype.displayFrame
		EffectAnimator.prototype.displayFrame = function (this: EffectAnimator, inLoop: boolean) {
			this.muted.particle = true
			this.muted.timeline = true
			defaultEffectDisplayFrame.call(this, inLoop)
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
