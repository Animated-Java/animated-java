const translate = ANIMATED_JAVA.translate

const rawExporter = new AnimatedJavaExporter({
	id: 'animated_java:raw_exporter',
	name: translate('animated_java.exporters.raw_exporter.name'),
	description: translate('animated_java.exporters.raw_exporter.description'),
	getSettings() {
		return {
			foo: new AnimatedJavaSettings.CheckboxSetting({
				id: 'animated_java:raw_exporter:foo',
				displayName: translate('animated_java.exporters.raw_exporter.settings.foo'),
				description: translate(
					'animated_java.exporters.raw_exporter.settings.foo.description'
				).split('\n'),
				defaultValue: false,
			}),
		}
	},
	settingsStructure: [
		{
			type: 'setting',
			id: 'animated_java:raw_exporter:foo',
		},
	],
	async export(ajSettings, projectSettings, exporterSettings) {
		console.groupCollapsed('rawExporter.export')
		console.log(ajSettings, projectSettings, exporterSettings)
		console.groupEnd()
	},
})

export {}
