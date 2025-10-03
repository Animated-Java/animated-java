import { activeProjectIsBlueprintFormat } from '../formats/blueprint/format'
import EVENTS from '../util/events'
import { registerMod } from '../util/moddingTools'

registerMod({
	id: `animated-java:keyframe-select-event-mod`,

	apply: () => {
		const originalKeyframeSelect = Blockbench.Keyframe.prototype.select
		Blockbench.Keyframe.prototype.select = function (this: _Keyframe, event: any) {
			if (!activeProjectIsBlueprintFormat()) return originalKeyframeSelect.call(this, event)
			const kf = originalKeyframeSelect.call(this, event)
			EVENTS.SELECT_KEYFRAME.publish(kf)
			return kf
		}

		const originalUpdateKeyframeSelection = updateKeyframeSelection
		globalThis.updateKeyframeSelection = function () {
			if (activeProjectIsBlueprintFormat()) return originalUpdateKeyframeSelection()

			Timeline.keyframes.forEach(kf => {
				if (kf.selected && Timeline.selected && !Timeline.selected.includes(kf)) {
					kf.selected = false
					EVENTS.UNSELECT_KEYFRAME.publish()
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
				EVENTS.SELECT_KEYFRAME.publish(Timeline.selected[0])
			}

			return originalUpdateKeyframeSelection()
		}

		const barItem = BarItems.keyframe_interpolation as BarSelect<string>
		const originalChange = (BarItems.keyframe_interpolation as BarSelect<string>).set
		barItem.set = function (this: BarSelect<string>, value) {
			const result = originalChange.call(this, value)

			if (activeProjectIsBlueprintFormat()) {
				if (Timeline.selected && Timeline.selected.length > 0) {
					EVENTS.SELECT_KEYFRAME.publish(Timeline.selected[0])
				} else {
					EVENTS.UNSELECT_KEYFRAME.publish()
				}
			}

			return result
		}

		return { originalKeyframeSelect, originalUpdateKeyframeSelection, barItem, originalChange }
	},

	revert: ({
		originalKeyframeSelect,
		originalUpdateKeyframeSelection,
		barItem,
		originalChange,
	}) => {
		Blockbench.Keyframe.prototype.select = originalKeyframeSelect
		globalThis.updateKeyframeSelection = originalUpdateKeyframeSelection
		barItem.change = originalChange
	},
})
