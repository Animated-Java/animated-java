const translate = ANIMATED_JAVA.translate

const animationExporter = new AnimatedJavaExporter({
	id: 'animated_java:animation_exporter',
	name: translate('animated_java.exporters.animation_exporter.name'),
	description: translate('animated_java.exporters.animation_exporter.description'),
	settings: {
		dummy2: new AnimatedJavaSettings.AJCheckboxSetting({
			id: 'animated_java:statue_exporter:dummy2',
			displayName: translate('animated_java.exporters.statue_exporter.settings.dummy2'),
			description: translate(
				'animated_java.exporters.statue_exporter.settings.dummy2.description'
			).split('\n'),
			defaultValue: false,
		}),
	},
})

export {}
