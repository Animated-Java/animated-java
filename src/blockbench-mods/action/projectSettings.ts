import PACKAGE from '../../../package.json'
import { BLUEPRINT_FORMAT } from '../../blockbench-additions/model-formats/ajblueprint'
import { openBlueprintSettingsDialog } from '../../ui/dialogs/blueprint-settings'
import { createBlockbenchMod } from '../../util/moddingTools'

createBlockbenchMod(
	`${PACKAGE.name}:mods/action/projectSettings`,
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
