// @ts-ignore
import en from './lang/en.yaml'
// @ts-ignore
import de from './lang/de.yaml'
// @ts-ignore
import zh from './lang/zh_cn.yaml'
import { constructJSON } from './jsonConstructor'

export function loadExporter() {
	const API = AnimatedJava.API

	API.addTranslations('en', en as Record<string, string>)
	API.addTranslations('de', de as Record<string, string>)
	API.addTranslations('zh', zh as Record<string, string>)

	const TRANSLATIONS = {
		output_file: {
			error: {
				empty: API.translate(
					'animated_java.exporters.json_exporter.settings.output_file.error.empty'
				),
			},
		},
	}

	new API.Exporter({
		id: 'animated_java:json_exporter',
		name: API.translate('animated_java.exporters.json_exporter.name'),
		description: API.translate('animated_java.exporters.json_exporter.description'),
		getSettings() {
			return {
				output_file: new API.Settings.FileSetting(
					{
						id: 'animated_java:json_exporter/output_file',
						displayName: API.translate(
							'animated_java.exporters.json_exporter.settings.output_file'
						),
						description: API.translate(
							'animated_java.exporters.json_exporter.settings.output_file.description'
						).split('\n'),
						defaultValue: '',
					},
					function onUpdate(setting) {
						if (!setting.value) {
							setting.infoPopup = API.createInfo(
								'error',
								TRANSLATIONS.output_file.error.empty
							)
						}
					}
				),
			}
		},
		settingsStructure: [
			{
				type: 'setting',
				settingId: 'animated_java:json_exporter/output_file',
			},
		],
		async export(exportOptions) {
			console.log('Export Options:', exportOptions)

			const json = constructJSON(exportOptions)

			console.log('Exported JSON:', json)

			await fs.promises.writeFile(
				exportOptions.exporterSettings.output_file.value,
				exportOptions.ajSettings.minify_output.value
					? JSON.stringify(json)
					: JSON.stringify(json, null, '\t')
			)
		},
	})
}
