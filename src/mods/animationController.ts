import { registerConditionalPropertyOverrideMod } from 'src/util/moddingTools'
import { activeProjectIsBlueprintFormat } from '../formats/blueprint/format'

registerConditionalPropertyOverrideMod({
	id: `animated-java:animation-controller-force-saved`,
	object: AnimationController.prototype,
	key: 'saved',
	get: {
		condition: () => activeProjectIsBlueprintFormat(),

		override: () => true,
	},
})
