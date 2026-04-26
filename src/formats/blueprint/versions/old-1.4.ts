export default function upgrade(model: any) {
	console.log('Processing model format 1.4', model)
	const fixed = JSON.parse(JSON.stringify(model))
	const exporter = fixed.animated_java.exporter_settings['animated_java:datapack_exporter']
	if (exporter && exporter.outdated_rig_warning !== undefined) {
		fixed.animated_java.exporter_settings[
			'animated_java:datapack_exporter'
		].enable_outdated_rig_warning =
			fixed.animated_java.exporter_settings[
				'animated_java:datapack_exporter'
			].outdated_rig_warning
		delete fixed.animated_java.exporter_settings['animated_java:datapack_exporter']
			.outdated_rig_warning
	}
	return fixed
}
