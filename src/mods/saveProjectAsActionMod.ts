import { registerMod } from 'src/util/moddingTools'
import { BLUEPRINT_CODEC, activeProjectIsBlueprintFormat } from '../blueprintFormat'

registerMod({
	id: `animated-java:save-project-as`,

	apply: () => {
		const action = BarItems.save_project_as as Action

		const originalClick = action.click
		action.click = (event: Event) => {
			if (!Project || !Format) return
			if (activeProjectIsBlueprintFormat()) {
				BLUEPRINT_CODEC.get()!.export()
			} else {
				originalClick.call(action, event)
			}
		}

		return { originalClick, action }
	},

	revert: ({ originalClick, action }) => {
		action.click = originalClick
	},
})
