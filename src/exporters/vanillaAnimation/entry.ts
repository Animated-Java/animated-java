import type * as aj from '../../animatedJava'
import { CustomError } from '../../util/customError'
import { tl } from '../../util/intl'
import { store } from '../../util/store'
import { settings, ExporterSettings } from './settings'
import { generate as generateBakedScoreboardTree } from './bakedScoreboardTree'

export class VanillaAnimation {
	static exportData: aj.ExportData
	static get settings() {
		return VanillaAnimation.exportData.settings.vanillaAnimation as ExporterSettings
	}
	static get ajSettings() {
		return VanillaAnimation.exportData.settings.animatedJava
	}
	static newExport(exportData: aj.ExportData) {
		VanillaAnimation.exportData = exportData
	}
	static get variants() {
		return store.get('variants')
	}
}

function _export(exportData: aj.ExportData) {
	VanillaAnimation.newExport(exportData)

	const mcFile = generateInternalMCStructure()

	switch (VanillaAnimation.settings.exportFormat) {
		case 'mcbuild':
			writeMCBuild(mcFile)
			break
		case 'vanilla':
			throw new Error('Vanilla export format is not implemented.')
		default:
			throw new Error(`Unknown export format '${VanillaAnimation.settings.exportFormat}'`)
	}
}

function generateInternalMCStructure() {
	let mcFile: string
	switch (VanillaAnimation.settings.exportMethod) {
		case 'bakedScoreboardTree':
			mcFile = generateBakedScoreboardTree()
			break
		case 'dynamicScoreboardMath':
			throw new Error('Dynamic Scoreboard Math export method is not implemented.')
		default:
			throw new Error(`Unknown export method '${VanillaAnimation.settings.exportMethod}'`)
	}

	// console.log('Generated MCFile:', mcFile)
	if (!mcFile) throw new Error('Failed to create internal .mc structure')

	return mcFile
}

function writeMCBuild(mcFile: string) {
	if (!VanillaAnimation.settings.mcFilePath)
		throw new CustomError('vanillaAnimation: mcFilePathNotDefined.', {
			showDialog: true,
			dialog: {
				id: 'vanillaAnimation.error.mcFilePathNotDefined',
				title: tl('vanillaAnimation.dialogs.errors.mcFilePathNotDefined.title'),
				lines: [tl('vanillaAnimation.dialogs.errors.mcFilePathNotDefined.body')],
				width: 512,
			},
		})
	Blockbench.writeFile(VanillaAnimation.settings.mcFilePath, {
		content: mcFile,
		custom_writer: null,
	})
}

const Exporter = (AJ: any) => {
	AJ.settings.registerPluginSettings(
		'animatedJava.exporters.vanillaAnimation', // Exporter ID
		'vanillaAnimation', // Exporter Settings Key
		settings
	)
	AJ.registerExportFunc('vanillaAnimation', function () {
		AJ.build(
			(exportData: aj.ExportData) => {
				console.log('Export Data:', exportData)
				_export(exportData)
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
