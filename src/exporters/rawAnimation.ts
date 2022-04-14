import type * as aj from '../animatedJava'
import { CustomError } from '../util/customError'
import { tl } from '../util/intl'
import { store } from '../util/store'

interface rawAnimationExporterSettings {
	outputJsonPath: string
}

function rawExport(exportData: aj.ExportData) {
	const ajSettings = exportData.settings.animatedJava
	const exporterSettings = exportData.settings
		.rawAnimationExporter as rawAnimationExporterSettings

	const FILE = {
		meta: {
			head_item: ajSettings.rigItem,
		},
		animations: exportData.animations,
	}

	if (!exporterSettings.outputJsonPath) {
		throw new CustomError(
			'animatedJava.exporters.rawAnimation.dialogs.errors.outputJsonPathUndefined.title',
			{
				showDialog: true,
				dialog: {
					id: 'animatedJava.exporters.rawAnimation.dialogs.errors.outputJsonPathUndefined',
					title: tl(
						'animatedJava.exporters.rawAnimation.dialogs.errors.outputJsonPathUndefined.title'
					),
					lines: [
						tl(
							'animatedJava.exporters.rawAnimation.dialogs.errors.outputJsonPathUndefined.body'
						),
					],
					width: 512,
					singleButton: true,
				},
			}
		)
	}

	Blockbench.writeFile(exporterSettings.outputJsonPath, {
		content: JSON.stringify(FILE, null, '\t'),
		custom_writer: null,
	})

	Blockbench.showQuickMessage(tl('animatedJava.popups.successfullyExported'))
}

const genericEmptySettingText = tl('animatedJava.settings.generic.errors.emptyValue')

const Exporter = (AJ: any) => {
	AJ.settings.registerPluginSettings(
		'animatedJava.exporters.rawAnimation', // Exporter ID
		'rawAnimationExporter', // Exporter Settings Key
		{
			outputJsonPath: {
				title: tl('animatedJava.exporters.rawAnimation.settings.outputJsonPath.title'),
				description: tl(
					'animatedJava.exporters.rawAnimation.settings.outputJsonPath.description'
				),
				type: 'filepath',
				default: '',
				optional: true,
				props: {
					dialogOpts: {
						get defaultPath() {
							return `output.json`
						},
						promptToCreate: true,
						properties: ['openFile'],
					},
				},
				onUpdate(d: aj.SettingDescriptor) {
					if (d.value === '') {
						d.isValid = false
						d.errors = genericEmptySettingText
					}
					return d
				},
			},
		}
	)
	AJ.registerExportFunc('rawAnimationExporter', function () {
		AJ.build(
			(exportData: aj.ExportData) => {
				console.log('Input Data:', exportData)
				rawExport(exportData)
			},
			{
				generate_static_animation: true,
			}
		)
	})
}

if (Reflect.has(window, 'ANIMATED_JAVA')) {
	Exporter(window['ANIMATED_JAVA'])
} else {
	// @ts-ignore
	Blockbench.on('animated-java-ready', Exporter)
}
