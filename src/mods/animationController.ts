import { activeProjectIsBlueprintFormat } from '../formats/blueprint'
import { registerConditionalPropertyOverrideMod } from '../util/moddingTools'

registerConditionalPropertyOverrideMod({
	id: `animated-java:animation-controller-force-saved`,
	object: AnimationController.prototype,
	key: 'saved',

	condition: () => activeProjectIsBlueprintFormat(),

	get: () => true,
})
