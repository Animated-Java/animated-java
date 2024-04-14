import { isCurrentFormat } from '../blueprintFormat'
import { PACKAGE } from '../constants'
import { roundToN } from '../util/misc'
import { ContextProperty, createBlockbenchMod } from '../util/moddingTools'
import { translate } from '../util/translation'

export const DEFAULT_SNAPPING_VALUE = 20

createBlockbenchMod(
	`${PACKAGE.name}:animationDefaultPropertiesMod`,
	{
		originalExtend: Blockbench.Animation.prototype.extend,
	},
	context => {
		Blockbench.Animation.prototype.extend = function (
			this: _Animation,
			data: AnimationOptions
		) {
			context.originalExtend.call(this, data)
			if (isCurrentFormat()) {
				this.snapping = DEFAULT_SNAPPING_VALUE
				for (const animator of Object.values(this.animators)) {
					if (!animator) continue
					let lastTime = -Infinity
					for (const kf of animator.keyframes) {
						let rounded = roundToN(kf.time, DEFAULT_SNAPPING_VALUE)
						if (rounded === kf.time) continue
						if (rounded === lastTime) rounded += 0.05
						kf.time = rounded
						lastTime = rounded
					}
				}
			}
			return this
		}
		return context
	},
	context => {
		Blockbench.Animation.prototype.extend = context.originalExtend
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
