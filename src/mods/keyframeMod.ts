import { PACKAGE } from '../constants'
import { events } from '../util/events'
import { createBlockbenchMod } from '../util/moddingTools'

createBlockbenchMod(
	`${PACKAGE.name}:keyframeSelectEventMod`,
	{
		originalKeyframeSelect: Blockbench.Keyframe.prototype.select,
	},
	context => {
		Blockbench.Keyframe.prototype.select = function (this: _Keyframe, event: any) {
			const kf = context.originalKeyframeSelect.call(this, event)
			events.SELECT_KEYFRAME.dispatch(kf)
			return kf
		}
		return context
	},
	context => {
		Blockbench.Keyframe.prototype.select = context.originalKeyframeSelect
	}
)
