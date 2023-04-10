// @ts-ignore
import en from './lang/en.yaml'

export function loadExporter() {
	const API = AnimatedJava.API

	API.addTranslations('en', en as Record<string, string>)

	new API.Exporter({
		id: 'animated_java:raw_exporter',
		name: API.translate('animated_java.exporters.raw_exporter.name'),
		description: API.translate('animated_java.exporters.raw_exporter.description'),
		getSettings() {
			return {
				foo: new API.Settings.CheckboxSetting({
					id: 'animated_java:raw_exporter/foo',
					displayName: API.translate('animated_java.exporters.raw_exporter.settings.foo'),
					description: API.translate(
						'animated_java.exporters.raw_exporter.settings.foo.description'
					).split('\n'),
					defaultValue: false,
				}),
			}
		},
		settingsStructure: [
			{
				type: 'setting',
				settingId: 'animated_java:raw_exporter/foo',
			},
		],
		async export(exportOptions) {
			console.log('Export Options:', exportOptions)
			const { ajSettings, projectSettings, exporterSettings } = exportOptions
			// Temporary placeholder to hide "no await" warning
			await new Promise(resolve => setTimeout(resolve, 100))
		},
	})
}
