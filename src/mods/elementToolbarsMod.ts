import { PACKAGE } from '../constants'
import { TextDisplay } from '../outliner/textDisplay'
import { createBlockbenchMod } from '../util/moddingTools'

createBlockbenchMod(
	`${PACKAGE.name}:element_toolbars`,
	{
		originalCondition: Toolbars.element_origin.condition,
	},
	context => {
		Toolbars.element_origin.condition = function () {
			if (TextDisplay.selected) return false
			return context.originalCondition()
		}
		return context
	},
	context => {
		Toolbars.element_origin.condition = context.originalCondition
	}
)
