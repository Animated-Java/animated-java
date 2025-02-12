import { BLUEPRINT_FORMAT } from '../../blockbench-additions/model-formats/ajblueprint'
import { PACKAGE } from '../../constants'
import { createBlockbenchMod } from '../../util/moddingTools'

createBlockbenchMod(
	`${PACKAGE.name}:mods/ui/animationsPanel`,
	{
		panel: Interface.Panels.animations,
	},
	context => {
		const originalFilesFunction = context.panel.inside_vue.$options.computed!
			.files as () => Record<string, any>

		context.panel.inside_vue.$options.computed!.files = function (this) {
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
			return originalFilesFunction.call(this)
		}

		return { ...context, originalFilesFunction }
	},
	context => {
		context.panel.inside_vue.$options.computed!.files = context.originalFilesFunction
	}
)
