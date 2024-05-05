import { isCurrentFormat } from '../blueprintFormat'
import { PACKAGE } from '../constants'
import { roundToNth } from '../util/misc'
import { ContextProperty, createBlockbenchMod } from '../util/moddingTools'
import { translate } from '../util/translation'

export const DEFAULT_SNAPPING_VALUE = 20
export const MINIMUM_ANIMATION_LENGTH = 0.05

createBlockbenchMod(
	`${PACKAGE.name}:animationDefaultPropertiesMod`,
	{
		originalExtend: Blockbench.Animation.prototype.extend,
		originalSetLength: Blockbench.Animation.prototype.setLength,
	},
	context => {
		Blockbench.Animation.prototype.extend = function (
			this: _Animation,
			data: AnimationOptions
		) {
			context.originalExtend.call(this, data)
			this.snapping = DEFAULT_SNAPPING_VALUE
			if (isCurrentFormat()) {
				this.length = Math.max(this.length, MINIMUM_ANIMATION_LENGTH)
				for (const animator of Object.values(this.animators)) {
					if (!animator) continue
					let lastTime = -Infinity
					for (const kf of animator.keyframes) {
						let rounded = roundToNth(kf.time, DEFAULT_SNAPPING_VALUE)
						if (rounded === kf.time) continue
						if (rounded === lastTime) rounded += 0.05
						kf.time = rounded
						lastTime = rounded
					}
				}
			}
			return this
		}

		Blockbench.Animation.prototype.setLength = function (this: _Animation, length?: number) {
			if (isCurrentFormat()) {
				length = Math.max(length || this.length, MINIMUM_ANIMATION_LENGTH)
			}
			return context.originalSetLength.call(this, length)
		}

		return context
	},
	context => {
		Blockbench.Animation.prototype.extend = context.originalExtend
		Blockbench.Animation.prototype.setLength = context.originalSetLength
	}
)

createBlockbenchMod(
	`${PACKAGE.name}:animationPropertiesMod`,
	{
		excludedBonesProperty: undefined as ContextProperty<'array'>,
	},
	context => {
		context.excludedBonesProperty = new Property(
			Blockbench.Animation,
			'array',
			'excluded_bones',
			{
				condition: () => isCurrentFormat(),
				label: translate('animation.excluded_bones'),
				default: [],
			}
		)
		return context
	},
	context => {
		context.excludedBonesProperty?.delete()
	}
)
