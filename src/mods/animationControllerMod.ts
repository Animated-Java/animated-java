import { BLUEPRINT_FORMAT } from '../blueprintFormat'
import { PACKAGE } from '../constants'
import { createBlockbenchMod, createPropertySubscribable } from '../util/moddingTools'

createBlockbenchMod(
	`${PACKAGE.name}:animationControllerMod`,
	undefined,
	() => {
		const [, set] = createPropertySubscribable(AnimationController.prototype, 'saved')
		const unsubSet = set.subscribe(({ storage }) => {
			if (Format.id === BLUEPRINT_FORMAT.id) {
				storage.value = true
			}
		})
		return { unsubSet }
	},
	context => {
		context.unsubSet()
	}
)
