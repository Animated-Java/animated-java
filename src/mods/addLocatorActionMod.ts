import { registerMod } from 'src/util/moddingTools'
import { isCurrentFormat } from '../blueprintFormat'

registerMod({
	id: `animated-java:add-locator-action`,

	apply: () => {
		const action = BarItems.add_locator as Action
		const originalCondition = (BarItems.add_locator as Action).condition
		action.condition = () => {
			if (isCurrentFormat()) return true
			return Condition(originalCondition)
		}

		Toolbars.outliner.add(action, 0)

		return { action, originalCondition }
	},

	revert: ({ action, originalCondition }) => {
		action.condition = originalCondition
		Toolbars.outliner.remove(action)
	},
})
