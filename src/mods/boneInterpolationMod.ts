import { Valuable } from 'src/util/stores'
import { isCurrentFormat } from '../blueprintFormat'
import { roundToNth } from '../util/misc'
import { registerMod } from '../util/moddingTools'

export const BONE_INTERPOLATION_ENABLED = new Valuable(true)

registerMod({
	id: `animated-java:bone-interpolation-mod`,

	apply: () => {
		const original = BoneAnimator.prototype.interpolate
		BoneAnimator.prototype.interpolate = function (
			this: BoneAnimator,
			channel,
			allowExpression,
			axis
		) {
			if (
				!BONE_INTERPOLATION_ENABLED.get() ||
				!isCurrentFormat() ||
				allowExpression === false
			) {
				return original.call(this, channel, allowExpression, axis)
			}

			const realTime = this.animation.time
			try {
				Timeline.time = roundToNth(this.animation.time, 20)

				let before: ArrayVector3 | false
				let after: ArrayVector3 | false
				let beforeTime: number
				let afterTime: number

				if (Timeline.time < realTime) {
					beforeTime = Timeline.time
					before = original.call(this, channel, allowExpression, axis)
					if (!before) return false

					afterTime = roundToNth(Timeline.time + 0.05, 20)
					Timeline.time = afterTime
					after = original.call(this, channel, allowExpression, axis)
					if (!after) return false
				} else {
					afterTime = Timeline.time
					after = original.call(this, channel, allowExpression, axis)
					if (!after) return false

					beforeTime = roundToNth(Timeline.time - 0.05, 20)
					Timeline.time = beforeTime
					before = original.call(this, channel, allowExpression, axis)
					if (!before) return false
				}
				const diff = (realTime - beforeTime) / (afterTime - beforeTime)

				const result: ArrayVector3 = [
					Math.lerp(before[0], after[0], diff),
					Math.lerp(before[1], after[1], diff),
					Math.lerp(before[2], after[2], diff),
				]

				return result
			} finally {
				Timeline.time = realTime
			}
		}

		return { original }
	},

	revert: ({ original }) => {
		BoneAnimator.prototype.interpolate = original
	},
})
