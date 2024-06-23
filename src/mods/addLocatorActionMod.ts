import { isCurrentFormat } from '../blueprintFormat'
import { PACKAGE } from '../constants'
import { createBlockbenchMod } from '../util/moddingTools'

createBlockbenchMod(
	`${PACKAGE.name}:addLocatorAction`,
	{
		action: BarItems.add_locator as Action,
		originalCondition: (BarItems.add_locator as Action).condition,
	},
	context => {
		context.action.condition = () => {
			if (isCurrentFormat()) return true
			return !!context.originalCondition?.()
		}

		Toolbars.outliner.add(context.action, 0)

		return context
	},
	context => {
		context.action.condition = context.originalCondition
		Toolbars.outliner.remove(context.action)
	}
)
