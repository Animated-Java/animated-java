import { registerMod } from 'src/util/moddingTools'
import { activeProjectIsBlueprintFormat } from '../blueprintFormat'
import { openAnimationPropertiesDialog } from '../interface/dialog/animationProperties'

registerMod({
	id: `animated-java:animation-properties-action`,

	apply: () => {
		const originalOpen = Blockbench.Animation.prototype.propertiesDialog
		Blockbench.Animation.prototype.propertiesDialog = function (this: _Animation) {
			if (activeProjectIsBlueprintFormat()) {
				if (!Blockbench.Animation.selected) {
					Blockbench.showQuickMessage('No animation selected')
					return
				}
				openAnimationPropertiesDialog(Blockbench.Animation.selected)
			} else {
				originalOpen.call(this)
			}
		}
		return { originalOpen }
	},

	revert: ({ originalOpen }) => {
		Blockbench.Animation.prototype.propertiesDialog = originalOpen
	},
})
