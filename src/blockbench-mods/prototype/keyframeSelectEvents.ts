import EVENTS from '@events'
import { isCurrentFormat } from '../../blockbench-additions/model-formats/ajblueprint'
import { PACKAGE } from '../../constants'
import { createBlockbenchMod } from '../../util/moddingTools'

/**
 * Dispatches custom events when keyframes are selected or unselected
 */
createBlockbenchMod(
	`${PACKAGE.name}:mods/prototype/keyframeSelectEvents`,
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
			EVENTS.SELECT_KEYFRAME.dispatch(kf)
			return kf
		}

		globalThis.updateKeyframeSelection = function () {
			if (isCurrentFormat()) return context.originalUpdateKeyframeSelection()

			Timeline.keyframes.forEach(kf => {
				if (kf.selected && Timeline.selected && !Timeline.selected.includes(kf)) {
					kf.selected = false
					EVENTS.UNSELECT_KEYFRAME.dispatch()
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
				EVENTS.SELECT_KEYFRAME.dispatch(Timeline.selected[0])
			}

			return context.originalUpdateKeyframeSelection()
		}

		context.barItem.set = function (this: BarSelect<string>, value) {
			const result = context.originalChange.call(this, value)

			if (isCurrentFormat()) {
				if (Timeline.selected && Timeline.selected.length > 0) {
					EVENTS.SELECT_KEYFRAME.dispatch(Timeline.selected[0])
				} else {
					EVENTS.UNSELECT_KEYFRAME.dispatch()
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
