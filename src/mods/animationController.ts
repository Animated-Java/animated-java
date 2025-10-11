import { registerConditionalPropertyOverrideMod } from 'src/util/moddingTools'
import { activeProjectIsBlueprintFormat } from '../formats/blueprint'

registerConditionalPropertyOverrideMod({
	id: `animated-java:animation-controller-force-saved`,
	object: AnimationController.prototype,
	key: 'saved',

	condition: () => activeProjectIsBlueprintFormat(),

	get: () => true,
})
