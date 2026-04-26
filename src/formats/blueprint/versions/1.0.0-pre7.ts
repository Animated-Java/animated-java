export default function upgrade(model: any) {
	console.log('Processing model format 1.0.0-pre7', model)
	const fixed = JSON.parse(JSON.stringify(model))

	if (fixed.project_settings.enable_resource_pack !== undefined) {
		fixed.project_settings.resource_pack_export_mode = fixed.project_settings
			.enable_resource_pack
			? 'raw'
			: 'none'
		delete fixed.project_settings.enable_resource_pack
	}

	if (fixed.project_settings.enable_data_pack !== undefined) {
		fixed.project_settings.data_pack_export_mode = fixed.project_settings.enable_data_pack
			? 'raw'
			: 'none'
		delete fixed.project_settings.enable_data_pack
	}

	return fixed
}
