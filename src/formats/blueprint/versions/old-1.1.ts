export default function upgrade(model: any) {
	console.log('Processing model format 1.1', model)
	const fixed = JSON.parse(JSON.stringify(model))

	fixed.animated_java.settings.resource_pack_mcmeta =
		fixed.animated_java.settings.resource_pack_folder
	delete fixed.animated_java.settings.resource_pack_folder

	const animationExporterSettings =
		fixed.animated_java.exporter_settings['animated_java:animation_exporter']
	if (animationExporterSettings) {
		animationExporterSettings.datapack_mcmeta = animationExporterSettings.datapack_folder
		delete animationExporterSettings.datapack_folder
	}

	return fixed
}
