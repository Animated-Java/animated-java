import { registerMod } from 'src/util/moddingTools'
import CSS from './globalCssMod.css'

registerMod({
	id: 'animated-java:global-css',

	apply: () => {
		return Blockbench.addCSS(CSS)
	},

	revert: deletable => {
		deletable.delete()
	},
})
