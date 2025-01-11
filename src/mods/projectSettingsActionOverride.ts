import PACKAGE from '../../package.json'
import { BLUEPRINT_FORMAT } from '../blueprintFormat'
import { openBlueprintSettingsDialog } from '../interface/dialog/blueprintSettings'
import { createBlockbenchMod } from '../util/moddingTools'

createBlockbenchMod(
	`${PACKAGE.name}:projectSettingsActionOverride`,
	{
		action: BarItems.project_window as Action,
		oldClick: (BarItems.project_window as Action).click,
	},
	context => {
		context.action.click = function (this, event: Event) {
			if (Format.id === BLUEPRINT_FORMAT.id) {
				openBlueprintSettingsDialog()
			} else {
				context.oldClick.call(this, event)
			}
		}
		return context
	},
	context => {
		context.action.click = context.oldClick
	}
)
