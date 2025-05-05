import { PACKAGE } from '../../constants'
import { createBlockbenchMod } from '../../util/moddingTools'

import { type EasingKey } from '../../util/easing'

interface IEasingProperties {
	easing?: EasingKey
	easingArgs?: any[]
}

export function reverseEasing(easing?: EasingKey): EasingKey | undefined {
	if (!easing) return easing
	if (easing.startsWith('easeInOut')) return easing
	if (easing.startsWith('easeIn')) return easing.replace('easeIn', 'easeOut')
	if (easing.startsWith('easeOut')) return easing.replace('easeOut', 'easeIn')
	return easing
}

createBlockbenchMod(
	`${PACKAGE.name}:mods/function-overwrites/reverseKeyframes`,
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
