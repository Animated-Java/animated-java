import { activeProjectIsBlueprintFormat } from '../blueprintFormat'
import { openBlueprintSettingsDialog } from '../interface/dialog/blueprintSettings'
import { registerMod } from '../util/moddingTools'

registerMod({
	id: `animated-java:project-settings-action-override`,

	apply: () => {
		const action = BarItems.project_window as Action

		const oldClick = action.click
		action.click = function (this, event: Event) {
			if (activeProjectIsBlueprintFormat()) {
				openBlueprintSettingsDialog()
			} else {
				oldClick.call(this, event)
			}
		}

		return { action, oldClick }
	},

	revert: ({ action, oldClick }) => {
		action.click = oldClick
	},
})
