import { registerPropertyOverridePatch } from 'blockbench-patch-manager'
import { activeProjectIsBlueprintFormat } from '../formats/blueprint'

registerPropertyOverridePatch({
	id: `animated_java:animation-controller-force-saved`,
	target: AnimationController.prototype,
	key: 'saved',

	getCondition: () => activeProjectIsBlueprintFormat(),

	get: () => true,
})
