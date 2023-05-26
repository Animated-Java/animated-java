import { ExportData } from '../datapackGen'
import { loadJSONText } from './text'
import { getScoreboards } from './scoreboards'
import { getTags } from './tags'

export class Globals {
	static exportData: ExportData

	static PROJECT_NAME: string
	static VARIANTS: typeof Project.animated_java_variants.variants
	static OUTDATED_RIG_WARNING_ENABLED: boolean
	static IS_SINGLE_ENTITY_RIG: boolean
	static DEFAULT_INTERPOLATION_DURATION: number
	static RIG_ITEM: string
	static DATAPACK_EXPORT_PATH: string

	static INTERNAL_FUNCTIONS: string
	static SCOREBOARD: ReturnType<typeof getScoreboards>
	static TAGS: ReturnType<typeof getTags>
	// static ENTITY_TYPES: ReturnType<typeof getEntityTypes>
	static TEXT: ReturnType<typeof loadJSONText>

	static readonly LOOP_MODES = ['loop', 'once', 'hold']

	// static DATAPACK: AnimatedJava.VirtualFolder
	// static DATA_FOLDER: AnimatedJava.VirtualFolder
	// static MINECRAFT_FOLDER: AnimatedJava.VirtualFolder

	static loadExportData(exportData: ExportData) {
		// const { VirtualFileSystem } = AnimatedJava.API
		const { projectSettings, exporterSettings, renderedAnimations, rig } = exportData

		Globals.exportData = exportData

		Globals.PROJECT_NAME = projectSettings.project_namespace.value
		Globals.INTERNAL_FUNCTIONS = `animated_java:${Globals.PROJECT_NAME}/zzzzzzzz`
		Globals.RIG_ITEM = projectSettings.rig_item.value
		Globals.DATAPACK_EXPORT_PATH = PathModule.parse(exporterSettings.datapack_mcmeta.value).dir
		Globals.VARIANTS = Project.animated_java_variants.variants
		Globals.OUTDATED_RIG_WARNING_ENABLED = exporterSettings.outdated_rig_warning.value
		Globals.IS_SINGLE_ENTITY_RIG =
			Object.keys(rig.nodeMap).length === 1 && renderedAnimations.length === 0
		Globals.DEFAULT_INTERPOLATION_DURATION = 1

		// Globals.DATAPACK = new VirtualFileSystem.VirtualFolder('virtual_datapack')
		// Globals.DATA_FOLDER = Globals.DATAPACK.newFolder('data')
		// Globals.MINECRAFT_FOLDER = Globals.DATA_FOLDER.newFolder('minecraft')

		Globals.SCOREBOARD = getScoreboards()
		Globals.TAGS = getTags()
		// Globals.ENTITY_TYPES = getEntityTypes()
		Globals.TEXT = loadJSONText()
	}
}
