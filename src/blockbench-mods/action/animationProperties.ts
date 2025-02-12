import { isCurrentFormat } from '../../blockbench-additions/model-formats/ajblueprint'
import { PACKAGE } from '../../constants'
import { openAnimationPropertiesDialog } from '../../ui/dialogs/animation-properties'
import { createBlockbenchMod } from '../../util/moddingTools'

createBlockbenchMod(
	`${PACKAGE.name}:mods/action/animationProperties`,
	{
		originalOpen: Blockbench.Animation.prototype.propertiesDialog,
	},
	context => {
		Blockbench.Animation.prototype.propertiesDialog = function (this: _Animation) {
			if (isCurrentFormat()) {
				if (!Blockbench.Animation.selected) {
					Blockbench.showQuickMessage('No animation selected')
					return
				}
				openAnimationPropertiesDialog(Blockbench.Animation.selected)
			} else {
				context.originalOpen.call(this)
			}
		}
		return context
	},
	context => {
		Blockbench.Animation.prototype.propertiesDialog = context.originalOpen
	}
)
