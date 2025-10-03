import { createPropertySubscribable, registerMod } from 'src/util/moddingTools'
import { activeProjectIsBlueprintFormat } from '../formats/blueprint/format'

registerMod({
	id: `animated-java:animation-controller-mod`,

	apply: () => {
		const [, set] = createPropertySubscribable(AnimationController.prototype, 'saved')
		const unsubSet = set.subscribe(({ storage }) => {
			if (activeProjectIsBlueprintFormat()) {
				storage.value = true
			}
		})

		return { unsubSet }
	},

	revert: ({ unsubSet }) => {
		unsubSet()
	},
})
