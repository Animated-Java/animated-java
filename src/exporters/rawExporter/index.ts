const translate = AnimatedJava.translate

new AnimatedJava.Exporter({
	id: 'animated_java:raw_exporter',
	name: translate('animated_java.exporters.raw_exporter.name'),
	description: translate('animated_java.exporters.raw_exporter.description'),
	getSettings() {
		return {
			foo: new AnimatedJava.Settings.CheckboxSetting({
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
		console.log(ajSettings, projectSettings, exporterSettings)
		// Temporary placeholder to hide "no await" warning
		await new Promise(resolve => setTimeout(resolve, 100))
	},
})

export {}
