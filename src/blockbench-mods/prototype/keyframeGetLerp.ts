import { isCurrentFormat } from '../../blockbench-additions/model-formats/ajblueprint'
import { PACKAGE } from '../../constants'
import { createBlockbenchMod } from '../../util/moddingTools'

import { easingFunctions, getEasingArgDefault, hasArgs } from '../../util/easing'

function lerp(start: number, stop: number, amt: number): number {
	return amt * (stop - start) + start
}

createBlockbenchMod(
	`${PACKAGE.name}:mods/prototype/keyframeGetLerp`,
	{
		originalGetLerp: Blockbench.Keyframe.prototype.getLerp,
	},
	context => {
		Blockbench.Keyframe.prototype.getLerp = function (
			this: _Keyframe,
			other,
			axis,
			amount,
			allowExpression
		): number {
			const easing = other.easing ?? 'linear'

			if (!isCurrentFormat() || easing === 'linear')
				return context.originalGetLerp.call(this, other, axis, amount, allowExpression)

			let easingFunc = easingFunctions[easing]
			if (hasArgs(easing)) {
				const arg1 =
					Array.isArray(other.easingArgs) && other.easingArgs.length > 0
						? other.easingArgs[0]
						: getEasingArgDefault(other)

				easingFunc = easingFunc.bind(null, arg1 ?? 0)
			}
			const easedAmount = easingFunc(amount)
			const start = this.calc(axis)
			const stop = other.calc(axis)
			const result = lerp(start, stop, easedAmount)

			if (Number.isNaN(result)) {
				throw new Error('Invalid easing function or arguments.')
			}
			return result
		}

		return context
	},
	context => {
		Blockbench.Keyframe.prototype.getLerp = context.originalGetLerp
	}
)
