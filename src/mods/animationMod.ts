import { ajModelFormat } from '../modelFormat'
import { roundToN } from '../util/misc'
import { createBlockbenchMod, createPropertySubscribable } from '../util/moddingTools'

createBlockbenchMod(
	'animated_java:animation/affected_bones',
	{
		extend: Blockbench.Animation.prototype.extend,
		setLength: Blockbench.Animation.prototype.setLength,
		compileBedrockAnimation: Blockbench.Animation.prototype.compileBedrockAnimation,
		propertyAffectedBones: undefined as Property<'array'> | undefined,
		propertyAffectedBonesIsAWhitelist: undefined as Property<'boolean'> | undefined,
	},
	context => {
		context.propertyAffectedBones = new Property(
			Blockbench.Animation,
			'array',
			'affected_bones',
			{
				condition: () => Format === ajModelFormat,
			}
		)

		context.propertyAffectedBonesIsAWhitelist = new Property(
			Blockbench.Animation,
			'boolean',
			'affected_bones_is_a_whitelist',
			{
				condition: () => Format === ajModelFormat,
			}
		)

		Blockbench.Animation.prototype.setLength = function (len?: number) {
			if (Format === ajModelFormat) {
				len = Math.max(len === undefined ? this.length : len, 0.05)
			}
			return context.setLength.call(this, len)
		}

		Blockbench.Animation.prototype.extend = function (
			this: _Animation,
			data: AnimationOptions
		) {
			context.extend.call(this, data)
			if (Format === ajModelFormat) {
				// console.log('extend', this, data)
				this.snapping = 20
				// Round keyframes to the nearest tick (0.05 seconds)
				for (const animator of Object.values(this.animators)) {
					if (!animator) continue
					let lastTime = -Infinity
					for (const keyframe of animator.keyframes) {
						let rounded = roundToN(keyframe.time, 20)
						if (rounded === keyframe.time) continue
						if (rounded === lastTime) rounded += 0.05
						keyframe.time = rounded
						lastTime = rounded
					}
				}
			}
			return this
		}

		Blockbench.Animation.prototype.compileBedrockAnimation = function (this: _Animation): any {
			const tag = context.compileBedrockAnimation.call(this)
			if (Format === ajModelFormat) {
				// console.log('compileBedrockAnimation', this)
				tag.affected_bones = this.affected_bones
				tag.affected_bones_is_a_whitelist = this.affected_bones_is_a_whitelist
			}
			return tag
		}

		return context
	},
	context => {
		context.propertyAffectedBones?.delete()
		context.propertyAffectedBonesIsAWhitelist?.delete()
		Blockbench.Animation.prototype.extend = context.extend
		Blockbench.Animation.prototype.setLength = context.setLength
		Blockbench.Animation.prototype.compileBedrockAnimation = context.compileBedrockAnimation
	}
)
