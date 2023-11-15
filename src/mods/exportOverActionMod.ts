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
			if (Format.id === BLUEPRINT_FORMAT.id) {
				if (Project.export_path) {
					BLUEPRINT_CODEC.write(BLUEPRINT_CODEC.compile(), Project.export_path)
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
