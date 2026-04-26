import type { IBlueprintFormatJSON } from '..'

export default function upgrade(model: any): IBlueprintFormatJSON {
	console.log('Processing model format 1.10.0-beta.4', JSON.parse(JSON.stringify(model)))
	const fixed: IBlueprintFormatJSON = JSON.parse(JSON.stringify(model))

	if (model.blueprint_settings.export_namespace) {
		fixed.blueprint_settings ??= {}
		fixed.blueprint_settings.blueprint_id ??= `aj:${model.blueprint_settings.export_namespace}`
	}

	if (model.meta.last_used_export_namespace) {
		fixed.meta ??= {}
		fixed.meta.last_used_blueprint_id ??= `aj:${model.last_used_export_namespace}`
	}

	return fixed
}
