import {
	BLUEPRINT_FORMAT,
	saveBlueprint,
} from '../../blockbench-additions/model-formats/ajblueprint'
import { PACKAGE } from '../../constants'
import { createBlockbenchMod } from '../../util/moddingTools'

createBlockbenchMod(
	`${PACKAGE.name}:mods/action/saveProject`,
	{
		action: BarItems.save_project as Action,
		originalClick: (BarItems.save_project as Action).click,
	},
	context => {
		context.action.click = (event: Event) => {
			if (!Project || !Format) return
			if (Format === BLUEPRINT_FORMAT) {
				saveBlueprint()
			} else {
				context.originalClick.call(context.action, event)
			}
		}
		return context
	},
	context => {
		context.action.click = context.originalClick
	}
)
