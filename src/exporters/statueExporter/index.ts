const translate = ANIMATED_JAVA.translate

const statueExporter = new AnimatedJavaExporter({
	id: 'animated_java:statue_exporter',
	name: translate('animated_java.exporters.statue_exporter.name'),
	description: translate('animated_java.exporters.statue_exporter.description'),
	getSettings() {
		return {
			foo: new AnimatedJavaSettings.CheckboxSetting({
				id: 'animated_java:statue_exporter:foo',
				displayName: translate('animated_java.exporters.statue_exporter.settings.foo'),
				description: translate(
					'animated_java.exporters.statue_exporter.settings.foo.description'
				).split('\n'),
				defaultValue: false,
			}),
		}
	},
	settingsStructure: [
		{
			type: 'setting',
			id: 'animated_java:statue_exporter:foo',
		},
	],
	async export(ajSettings, projectSettings, exporterSettings) {
		console.groupCollapsed('statueExporter.export')
		console.log(ajSettings, projectSettings, exporterSettings)
		console.groupEnd()
	},
})

export {}
