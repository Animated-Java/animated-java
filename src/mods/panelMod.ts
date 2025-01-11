import { BLUEPRINT_FORMAT } from '../blueprintFormat'
import { PACKAGE } from '../constants'
import { createBlockbenchMod } from '../util/moddingTools'

createBlockbenchMod(
	`${PACKAGE.name}:panelMod`,
	{
		panel: Interface.Panels.animations,
	},
	context => {
		const originalFilesFunction = context.panel.inside_vue.$options.computed.files

		context.panel.inside_vue.$options.computed.files = function (this) {
			if (Format.id === BLUEPRINT_FORMAT.id) {
				return {
					'': {
						animations: [
							...Blockbench.Animation.all,
							...Blockbench.AnimationController.all,
						],
						name: '',
						hide_head: true,
					},
				}
			}
			// eslint-disable-next-line @typescript-eslint/no-unsafe-return
			return originalFilesFunction.call(this)
		}

		return { ...context, originalFilesFunction }
	},
	context => {
		context.panel.inside_vue.$options.computed.files = context.originalFilesFunction
	}
)
