import { registerPropertyOverridePatch } from 'blockbench-patch-manager'
import { activeProjectIsBlueprintFormat } from '../formats/blueprint'

registerPropertyOverridePatch({
	id: 'animated_java:property-condition-override/collection/export-path',
	target: Collection.properties.export_path,
	key: 'condition',

	getCondition: () => activeProjectIsBlueprintFormat(),

	get: () => false,
})
