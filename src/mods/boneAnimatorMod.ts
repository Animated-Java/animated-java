import { registerPropertyOverridePatch } from 'blockbench-patch-manager'
import { observable } from 'svelte-observable-store'
import { activeProjectIsBlueprintFormat } from '../formats/blueprint'
import { roundToNth } from '../util/misc'

export const BONE_INTERPOLATION_ENABLED = observable(true)

//region Interpolate
registerPropertyOverridePatch({
	id: `animated_java:override-function/bone-animator/interpolate`,
	target: BoneAnimator.prototype,
	key: 'interpolate',

	getCondition: () => BONE_INTERPOLATION_ENABLED.get() && activeProjectIsBlueprintFormat(),

	get: original => {
		return function (this: BoneAnimator, channel, allowExpression, axis) {
			if (
				!BONE_INTERPOLATION_ENABLED.get() ||
				!activeProjectIsBlueprintFormat() ||
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
	},
})
