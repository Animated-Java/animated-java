import { registerPatch } from 'blockbench-patch-manager'
import CSS from './globalCssMod.css'

registerPatch({
	id: 'animated_java:global-css',

	apply: () => {
		return Blockbench.addCSS(CSS)
	},

	revert: deletable => {
		deletable.delete()
	},
})
