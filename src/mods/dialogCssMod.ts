import { registerMod } from 'src/util/moddingTools'
import CSS from './dialogCssMod.css'

registerMod({
	id: 'animated-java:dialog-css-fixes',

	apply: () => {
		return Blockbench.addCSS(CSS)
	},

	revert: deletable => {
		deletable.delete()
	},
})
