import { BLUEPRINT_CODEC, BLUEPRINT_FORMAT } from '../blueprintFormat'
import { PACKAGE } from '../constants'
import { createBlockbenchMod } from '../util/moddingTools'

createBlockbenchMod(
	`${PACKAGE.name}:exportOverAction`,
	{
		action: BarItems.export_over as Action,
		originalClick: (BarItems.export_over as Action).click,
	},
	context => {
		context.action.click = (event: Event) => {
			if (!Project || !Format) return
			if (Format.id === BLUEPRINT_FORMAT.id) {
				const path = Project.save_path || Project.export_path
				if (path) {
					if (fs.existsSync(PathModule.dirname(path))) {
						Project.save_path = path
						BLUEPRINT_CODEC.write(BLUEPRINT_CODEC.compile(), path)
					} else {
						console.error(
							`Failed to export Animated Java Blueprint, file location '${path}' does not exist!`
						)
						BLUEPRINT_CODEC.export()
					}
				} else {
					BLUEPRINT_CODEC.export()
				}
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
