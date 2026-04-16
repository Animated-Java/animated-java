export default function upgrade(model: any) {
	console.log('Processing model format 1.3', model)
	const fixed = JSON.parse(JSON.stringify(model))
	if (fixed.animated_java.settings.exporter === 'animated_java:animation_exporter') {
		fixed.animated_java.settings.exporter = 'animated_java:datapack_exporter'
	}
	if (fixed.animated_java.exporter_settings['animated_java:animation_exporter']) {
		fixed.animated_java.exporter_settings['animated_java:datapack_exporter'] =
			fixed.animated_java.exporter_settings['animated_java:animation_exporter']
		delete fixed.animated_java.exporter_settings['animated_java:animation_exporter']
	}
	return fixed
}
