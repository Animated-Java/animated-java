import { activeProjectIsBlueprintFormat } from '../formats/blueprint/format'
import { registerMod } from '../util/moddingTools'

registerMod({
	id: `animated-java:panel-mod`,

	apply: () => {
		const panel = Interface.Panels.animations

		const originalFilesFunction = panel.inside_vue.$options.computed!.files as () => any
		panel.inside_vue.$options.computed!.files = function (this) {
			if (activeProjectIsBlueprintFormat()) {
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

		return { panel, originalFilesFunction }
	},

	revert: ({ panel, originalFilesFunction }) => {
		panel.inside_vue.$options.computed!.files = originalFilesFunction
	},
})
