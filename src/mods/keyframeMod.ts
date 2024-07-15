import { isCurrentFormat } from '../blueprintFormat'
import { PACKAGE } from '../constants'
import { events } from '../util/events'
import { ContextProperty, createBlockbenchMod } from '../util/moddingTools'
import {
	EASING_DEFAULT,
	EasingKey,
	easingFunctions,
	getEasingArgDefault,
	hasArgs,
} from '../util/easing'

interface IEasingProperties {
	easing?: EasingKey
	easingArgs?: any[]
}

createBlockbenchMod(
	`${PACKAGE.name}:keyframeSelectEventMod`,
	{
		originalKeyframeSelect: Blockbench.Keyframe.prototype.select,
		originalUpdateKeyframeSelection: updateKeyframeSelection,
		barItem: BarItems.keyframe_interpolation as BarSelect<string>,
		originalChange: (BarItems.keyframe_interpolation as BarSelect<string>).set,
	},
	context => {
		Blockbench.Keyframe.prototype.select = function (this: _Keyframe, event: any) {
			if (!isCurrentFormat()) return context.originalKeyframeSelect.call(this, event)
			const kf = context.originalKeyframeSelect.call(this, event)
			events.SELECT_KEYFRAME.dispatch(kf)
			return kf
		}

		globalThis.updateKeyframeSelection = function () {
			if (isCurrentFormat()) return context.originalUpdateKeyframeSelection()

			Timeline.keyframes.forEach(kf => {
				if (kf.selected && Timeline.selected && !Timeline.selected.includes(kf)) {
					kf.selected = false
					events.UNSELECT_KEYFRAME.dispatch()
				}
				let hasExpressions = false
				if (kf.transform) {
					hasExpressions = !!kf.data_points.find(point => {
						return (
							!isStringNumber(point.x) ||
							!isStringNumber(point.y) ||
							!isStringNumber(point.z)
						)
					})
				}
				if (hasExpressions != kf.has_expressions) {
					kf.has_expressions = hasExpressions
				}
			})

			if (Timeline.selected) {
				console.log('Selected keyframe:', Timeline.selected[0])
				events.SELECT_KEYFRAME.dispatch(Timeline.selected[0])
			}

			return context.originalUpdateKeyframeSelection()
		}

		context.barItem.set = function (this: BarSelect<string>, value) {
			const result = context.originalChange.call(this, value)

			if (isCurrentFormat()) {
				if (Timeline.selected && Timeline.selected.length > 0) {
					events.SELECT_KEYFRAME.dispatch(Timeline.selected[0])
				} else {
					events.UNSELECT_KEYFRAME.dispatch()
				}
			}

			return result
		}

		return context
	},
	context => {
		Blockbench.Keyframe.prototype.select = context.originalKeyframeSelect
		globalThis.updateKeyframeSelection = context.originalUpdateKeyframeSelection
		context.barItem.change = context.originalChange
	}
)

export function reverseEasing(easing?: EasingKey): EasingKey | undefined {
	if (!easing) return easing
	if (easing.startsWith('easeInOut')) return easing
	if (easing.startsWith('easeIn')) return easing.replace('easeIn', 'easeOut')
	if (easing.startsWith('easeOut')) return easing.replace('easeOut', 'easeIn')
	return easing
}

createBlockbenchMod(
	`${PACKAGE.name}:reverseKeyframesMod`,
	{
		action: BarItems.reverse_keyframes as Action,
		originalClick: (BarItems.reverse_keyframes as Action).click,
	},
	context => {
		context.action.click = function (event?: Event) {
			context.originalClick.call(this, event)
			// There's not really an easy way to merge our undo operation with the original one so we'll make a new one instead
			Undo.initEdit({ keyframes: Timeline.selected || undefined })

			const kfByAnimator: Record<string, _Keyframe[]> = {}
			for (const kf of Timeline.selected || []) {
				kfByAnimator[kf.animator.uuid] ??= []
				kfByAnimator[kf.animator.uuid].push(kf)
			}

			const kfByAnimatorAndChannel: Record<string, Record<string, _Keyframe[]>> = {}
			for (const [animatorUuid, keyframes] of Object.entries(kfByAnimator)) {
				const channel: Record<string, _Keyframe[]> = {}
				kfByAnimatorAndChannel[animatorUuid] = channel
				for (const kf of keyframes) {
					channel[kf.channel] ??= []
					channel[kf.channel].push(kf)
				}
			}

			for (const channelGroups of Object.values(kfByAnimatorAndChannel)) {
				for (const keyframes of Object.values(channelGroups)) {
					// Ensure keyframes are in temporal order. Not sure if this is already the case, but it couldn't hurt
					keyframes.sort((a, b) => a.time - b.time)
					// Reverse easing direction
					const easingData: IEasingProperties[] = keyframes.map((kf: _Keyframe) => ({
						easing: reverseEasing(kf.easing),
						easingArgs: kf.easingArgs,
					}))
					// Shift easing data to the right by one keyframe
					keyframes.forEach((kf: _Keyframe, i: number) => {
						if (i == 0) {
							kf.easing = undefined
							kf.easingArgs = undefined
							return
						}
						const newEasingData = easingData[i - 1]
						kf.easing = newEasingData.easing
						kf.easingArgs = newEasingData.easingArgs
					})
				}
			}

			Undo.finishEdit('Reverse keyframe easing')
			updateKeyframeSelection()
			Animator.preview()
		}
		return context
	},
	context => {
		context.action.click = context.originalClick
	}
)

function lerp(start: number, stop: number, amt: number): number {
	return amt * (stop - start) + start
}

createBlockbenchMod(
	`${PACKAGE.name}:keyframeEasingMod`,
	{
		originalGetLerp: Blockbench.Keyframe.prototype.getLerp,
		easingProperty: undefined as ContextProperty<'string'>,
		easingArgsProperty: undefined as ContextProperty<'array'>,
	},
	context => {
		context.easingProperty = new Property(Blockbench.Keyframe, 'string', 'easing', {
			default: EASING_DEFAULT,
			condition: isCurrentFormat(),
		})
		context.easingArgsProperty = new Property(Blockbench.Keyframe, 'array', 'easingArgs', {
			condition: isCurrentFormat(),
		})

		Blockbench.Keyframe.prototype.getLerp = function (
			this: _Keyframe,
			other,
			axis,
			amount,
			allowExpression
		): number {
			if (!isCurrentFormat())
				return context.originalGetLerp.call(this, other, axis, amount, allowExpression)

			const easing = other.easing || 'linear'
			let easingFunc = easingFunctions[easing]
			if (hasArgs(easing)) {
				const arg1 =
					Array.isArray(other.easingArgs) && other.easingArgs.length > 0
						? other.easingArgs[0]
						: getEasingArgDefault(other)

				easingFunc = easingFunc.bind(null, arg1 || 0)
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
		context.easingProperty?.delete()
		context.easingArgsProperty?.delete()
		Blockbench.Keyframe.prototype.getLerp = context.originalGetLerp
	}
)
