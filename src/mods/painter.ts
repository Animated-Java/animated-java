import { registerPropertyOverridePatch } from 'blockbench-patch-manager'
import { Interaction } from '../outliner/interaction'

declare global {
	namespace Painter {
		function startPaintToolCanvas(
			data: { element?: OutlinerElement },
			event: PointerEvent
		): void
	}
}

registerPropertyOverridePatch({
	id: `animated_java:painter/startPaintToolCanvas`,
	target: Painter,
	key: 'startPaintToolCanvas',
	get(value) {
		return function (this: typeof Painter, data, event: PointerEvent) {
			if (data.element instanceof Interaction) {
				return
			}
			return value.apply(this, [data, event])
		}
	},
})
