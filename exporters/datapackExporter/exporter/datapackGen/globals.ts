import { ExportData } from '../datapackGen'
import { getEntityTypes, getScoreboard, getTags, loopModes } from './data'
import { loadTellrawMessages } from './tellrawMessages'

export class Globals {
	static exportData: ExportData

	static NAMESPACE: string
	static VARIANTS: typeof Project.animated_java_variants.variants
	static OUTDATED_RIG_WARNING_ENABLED: boolean
	static IS_SINGLE_ENTITY_RIG: boolean
	static DEFAULT_INTERPOLATION_DURATION: number
	static RIG_ITEM: string
	static DATAPACK_EXPORT_PATH: string

	static AJ_NAMESPACE: string
	static SCOREBOARD: ReturnType<typeof getScoreboard>
	static TAGS: ReturnType<typeof getTags>
	static ENTITY_TYPES: ReturnType<typeof getEntityTypes>
	static TELLRAW: ReturnType<typeof loadTellrawMessages>

	static readonly LOOP_MODES = loopModes

	static DATAPACK: AnimatedJava.VirtualFolder
	static DATA_FOLDER: AnimatedJava.VirtualFolder
	static MINECRAFT_FOLDER: AnimatedJava.VirtualFolder

	static loadExportData(exportData: ExportData) {
		const { VirtualFileSystem } = AnimatedJava.API
		const { projectSettings, exporterSettings, renderedAnimations, rig } = exportData

		Globals.exportData = exportData

		Globals.NAMESPACE = projectSettings.project_namespace.value
		Globals.AJ_NAMESPACE = `zzz_${Globals.NAMESPACE}_internal`
		Globals.RIG_ITEM = projectSettings.rig_item.value
		Globals.DATAPACK_EXPORT_PATH = PathModule.parse(exporterSettings.datapack_mcmeta.value).dir
		Globals.VARIANTS = Project.animated_java_variants.variants
		Globals.OUTDATED_RIG_WARNING_ENABLED = exporterSettings.outdated_rig_warning.value
		Globals.IS_SINGLE_ENTITY_RIG =
			Object.keys(rig.nodeMap).length === 1 && renderedAnimations.length === 0
		Globals.DEFAULT_INTERPOLATION_DURATION = exporterSettings.interpolation_duration.value

		Globals.DATAPACK = new VirtualFileSystem.VirtualFolder(Globals.NAMESPACE)
		Globals.DATA_FOLDER = Globals.DATAPACK.newFolder('data')
		Globals.MINECRAFT_FOLDER = Globals.DATA_FOLDER.newFolder('minecraft')

		Globals.SCOREBOARD = getScoreboard()
		Globals.TAGS = getTags()
		Globals.ENTITY_TYPES = getEntityTypes()
		Globals.TELLRAW = loadTellrawMessages()
	}
}
