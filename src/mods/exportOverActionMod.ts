import { BLUEPRINT_CODEC, BLUEPRINT_FORMAT } from '../blueprintFormat'
import { createBlockbenchMod } from '../util/moddingTools'

createBlockbenchMod(
	'animated_java:export_over',
	{
		action: BarItems.export_over as Action,
		originalClick: (BarItems.export_over as Action).click,
	},
	context => {
		context.action.click = (event: Event) => {
			if (!Project || !Format) return
			console.log('Export Over')
			if (Format.id === BLUEPRINT_FORMAT.id) {
				if (Project.save_path || Project.export_path) {
					BLUEPRINT_CODEC.write(
						BLUEPRINT_CODEC.compile(),
						Project.save_path || Project.export_path
					)
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
