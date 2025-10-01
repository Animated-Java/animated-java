import { createPropertySubscribable, registerMod } from 'src/util/moddingTools'
import { isCurrentFormat } from '../blueprintFormat'

registerMod({
	id: `animated-java:animation-controller-mod`,

	apply: () => {
		const [, set] = createPropertySubscribable(AnimationController.prototype, 'saved')
		const unsubSet = set.subscribe(({ storage }) => {
			if (isCurrentFormat()) {
				storage.value = true
			}
		})

		return { unsubSet }
	},

	revert: ({ unsubSet }) => {
		unsubSet()
	},
})
