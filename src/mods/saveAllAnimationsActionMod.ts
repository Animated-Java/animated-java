import { activeProjectIsBlueprintFormat } from '../formats/blueprint/format'
import { registerMod } from '../util/moddingTools'

registerMod({
	id: `animated-java:save-all-animations-action-mod`,

	apply: () => {
		const action = BarItems.save_all_animations as Action

		const originalCondition = action.condition
		action.condition = function (this: Action) {
			if (activeProjectIsBlueprintFormat()) {
				return false
			}
			return Condition(originalCondition)
		}

		return { action, originalCondition }
	},

	revert: ({ action, originalCondition }) => {
		action.condition = originalCondition
	},
})
