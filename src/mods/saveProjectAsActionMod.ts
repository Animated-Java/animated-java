import { BLUEPRINT_CODEC } from 'src/formats/blueprint/codec'
import { registerMod } from 'src/util/moddingTools'
import { activeProjectIsBlueprintFormat } from '../formats/blueprint/format'

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
