import { BLUEPRINT_CODEC, BLUEPRINT_FORMAT } from '../blueprintFormat'
import { registerMod } from '../util/moddingTools'

registerMod({
	id: `animated-java:export-over-action`,

	apply: () => {
		const action = BarItems.export_over as Action

		const originalClick = (BarItems.export_over as Action).click
		action.click = (event: Event) => {
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
				originalClick.call(action, event)
			}
		}

		return { action, originalClick }
	},

	revert: ({ action, originalClick }) => {
		action.click = originalClick
	},
})
