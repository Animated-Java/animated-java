import { registerPatch } from 'blockbench-patch-manager'

//region Add Locator
registerPatch({
	id: `animated_java:append-toolbar/outliner/add-locator-action`,

	apply: () => {
		const action = BarItems.add_locator as Action
		Toolbars.outliner.add(action, 0)
		return { action }
	},

	revert: ({ action }) => {
		Toolbars.outliner.remove(action)
	},
})
