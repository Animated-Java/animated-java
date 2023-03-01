const translate = ANIMATED_JAVA.translate

const animationExporter = new AnimatedJavaExporter({
	id: 'animated_java:animation_exporter',
	name: translate('animated_java.exporters.animation_exporter.name'),
	description: translate('animated_java.exporters.animation_exporter.description'),
	getSettings() {
		return {
			bar: new AnimatedJavaSettings.InlineTextSetting({
				id: 'animated_java:animation_exporter:bar',
				displayName: translate('animated_java.exporters.animation_exporter.settings.bar'),
				description: translate(
					'animated_java.exporters.animation_exporter.settings.bar.description'
				).split('\n'),
				defaultValue: 'Hello World!',
			}),
		}
	},
	settingsStructure: [
		{
			type: 'setting',
			id: 'animated_java:animation_exporter:bar',
		},
	],
	async export(ajSettings, projectSettings, exporterSettings, renderedAnimations) {
		console.log(ajSettings, projectSettings, exporterSettings, renderedAnimations)
	},
})

export {}
