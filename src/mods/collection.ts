import { activeProjectIsBlueprintFormat } from 'src/formats/blueprint'
import { registerConditionalPropertyOverrideMod } from 'src/util/moddingTools'

registerConditionalPropertyOverrideMod({
	id: 'animated-java:property-condition-override/collection/export-path',
	object: Collection.properties.export_path,
	key: 'condition',
	get: {
		condition: () => activeProjectIsBlueprintFormat(),

		override: () => false,
	},
})
