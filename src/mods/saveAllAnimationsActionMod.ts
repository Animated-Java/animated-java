import { BLUEPRINT_FORMAT } from '../blueprintFormat'
import { PACKAGE } from '../constants'
import { createBlockbenchMod } from '../util/moddingTools'

createBlockbenchMod(
	`${PACKAGE.name}:saveAllAnimationsActionMod`,
	{
		action: BarItems.save_all_animations as Action,
	},
	context => {
		const originalCondition = context.action.condition!
		context.action.condition = function (this: Action) {
			if (Format.id === BLUEPRINT_FORMAT.id) {
				return false
			}
			return originalCondition.call(this)
		}
		return { ...context, originalCondition }
	},
	context => {
		context.action.condition = context.originalCondition
	}
)
