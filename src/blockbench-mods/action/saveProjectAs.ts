import {
	BLUEPRINT_CODEC,
	BLUEPRINT_FORMAT,
} from '../../blockbench-additions/model-formats/ajblueprint'
import { PACKAGE } from '../../constants'
import { createBlockbenchMod } from '../../util/moddingTools'

createBlockbenchMod(
	`${PACKAGE.name}:mods/action/saveProjectAs`,
	{
		action: BarItems.save_project_as as Action,
		originalClick: (BarItems.save_project_as as Action).click,
	},
	context => {
		context.action.click = (event: Event) => {
			if (!Project || !Format) return
			if (Format === BLUEPRINT_FORMAT) {
				BLUEPRINT_CODEC.export()
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
