export default function upgrade(model: any) {
	console.log('Processing model format 1.4.0', model)
	const fixed = JSON.parse(JSON.stringify(model))

	// Separated advanced folders from advanced settings
	if (fixed.blueprint_settings.enable_advanced_resource_pack_settings) {
		fixed.blueprint_settings.enable_advanced_resource_pack_folders = true
	}

	// Custom model data is now hidden behind advanced settings
	if (
		fixed.blueprint_settings.custom_model_data_offset !== undefined &&
		fixed.blueprint_settings.custom_model_data_offset !== 0
	) {
		fixed.blueprint_settings.enable_advanced_resource_pack_settings = true
	}

	return fixed
}
