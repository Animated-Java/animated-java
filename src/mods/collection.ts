import { activeProjectIsBlueprintFormat } from '../formats/blueprint'
import { registerConditionalPropertyOverrideMod } from '../util/moddingTools'

registerConditionalPropertyOverrideMod({
	id: 'animated-java:property-condition-override/collection/export-path',
	object: Collection.properties.export_path,
	key: 'condition',

	condition: () => activeProjectIsBlueprintFormat(),

	get: () => false,
})
