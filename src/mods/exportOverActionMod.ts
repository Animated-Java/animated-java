import { BLUEPRINT_CODEC } from 'src/formats/blueprint/codec'
import { activeProjectIsBlueprintFormat } from '../formats/blueprint/format'
import { registerMod } from '../util/moddingTools'

registerMod({
	id: `animated-java:export-over-action`,

	apply: () => {
		const action = BarItems.export_over as Action

		const originalClick = (BarItems.export_over as Action).click
		action.click = (event: Event) => {
			if (!Project || !Format) return
			if (activeProjectIsBlueprintFormat()) {
				const codec = BLUEPRINT_CODEC.get()!

				const path = Project.save_path || Project.export_path
				if (path) {
					if (fs.existsSync(PathModule.dirname(path))) {
						Project.save_path = path
						codec.write(codec.compile(), path)
					} else {
						console.error(
							`Failed to export Animated Java Blueprint, file location '${path}' does not exist!`
						)
						codec.export()
					}
				} else {
					codec.export()
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
