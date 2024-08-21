import { isCurrentFormat } from '../blueprintFormat'
import { PACKAGE } from '../constants'
import { roundToNth } from '../util/misc'
import { createBlockbenchMod } from '../util/moddingTools'

createBlockbenchMod(
	`${PACKAGE.name}:boneInterpolationMod`,
	{
		orignalInterpolate: BoneAnimator.prototype.interpolate,
	},
	context => {
		BoneAnimator.prototype.interpolate = function (
			this: BoneAnimator,
			channel,
			allowExpression,
			axis
		) {
			if (!isCurrentFormat() || !allowExpression) {
				return context.orignalInterpolate.call(this, channel, allowExpression, axis)
			}

			const actualTime = this.animation.time
			try {
				Timeline.time = roundToNth(this.animation.time, 20)

				let before: ArrayVector3 | false
				let after: ArrayVector3 | false
				let beforeTime: number
				let afterTime: number

				if (Timeline.time < actualTime) {
					beforeTime = Timeline.time
					before = context.orignalInterpolate.call(this, channel, allowExpression, axis)
					if (!before) return false

					afterTime = roundToNth(Timeline.time + 0.05, 20)
					Timeline.time = afterTime
					after = context.orignalInterpolate.call(this, channel, allowExpression, axis)
					if (!after) return false
				} else {
					afterTime = Timeline.time
					after = context.orignalInterpolate.call(this, channel, allowExpression, axis)
					if (!after) return false

					beforeTime = roundToNth(Timeline.time - 0.05, 20)
					Timeline.time = beforeTime
					before = context.orignalInterpolate.call(this, channel, allowExpression, axis)
					if (!before) return false
				}
				const diff = (actualTime - beforeTime) / (afterTime - beforeTime)

				const result: ArrayVector3 = [
					Math.lerp(before[0], after[0], diff),
					Math.lerp(before[1], after[1], diff),
					Math.lerp(before[2], after[2], diff),
				]
				// console.log(diff)

				return result

				// context.orignalInterpolate.call(this, channel, allowExpression, axis)
			} finally {
				Timeline.time = actualTime
			}
		}

		return context
	},
	context => {
		context.orignalInterpolate = BoneAnimator.prototype.interpolate
	}
)
