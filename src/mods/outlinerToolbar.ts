import { registerMod } from 'src/util/moddingTools'

//region Add Locator
registerMod({
	id: `animated-java:append-toolbar/outliner/add-locator-action`,

	apply: () => {
		const action = BarItems.add_locator as Action
		Toolbars.outliner.add(action, 0)
		return { action }
	},

	revert: ({ action }) => {
		Toolbars.outliner.remove(action)
	},
})
