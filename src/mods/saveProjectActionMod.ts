import { activeProjectIsBlueprintFormat, saveBlueprint } from '../formats/blueprint/format'
import { registerMod } from '../util/moddingTools'

registerMod({
	id: `animated-java:save-project`,

	apply: () => {
		const action = BarItems.save_project as Action

		const originalClick = action.click
		action.click = (event: Event) => {
			if (!Project || !Format) return
			if (activeProjectIsBlueprintFormat()) {
				saveBlueprint()
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
