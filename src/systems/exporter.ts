import { saveBlueprint } from '../blueprintFormat'
import { openUnexpectedErrorDialog } from '../interface/unexpectedErrorDialog'
import { renderProjectAnimations } from './animationRenderer'
import { compileDataPack } from './datapackCompiler'
import { compileResourcePack } from './resourcepackCompiler'
import { renderRig } from './rigRenderer'

export function exportProject() {
	try {
		if (!Project) return // TODO: Handle this error better
		const aj = Project.animated_java

		let resourcePackFolder: string,
			dataPackFolder: string,
			textureExportFolder: string,
			modelExportFolder: string,
			displayItemPath: string

		resourcePackFolder = aj.resource_pack
		dataPackFolder = aj.data_pack

		if (aj.enable_advanced_resource_pack_settings) {
			modelExportFolder = aj.model_folder
			textureExportFolder = aj.texture_folder
			displayItemPath = aj.display_item_path
		} else {
			modelExportFolder = PathModule.join(
				resourcePackFolder,
				'assets/animated_java/models/item/',
				aj.export_namespace
			)
			textureExportFolder = PathModule.join(
				resourcePackFolder,
				'assets/animated_java/textures/item/',
				aj.export_namespace
			)
			displayItemPath = PathModule.join(
				resourcePackFolder,
				'assets/minecraft/models/item/',
				aj.display_item.split(':').at(-1)! + '.json'
			)
		}

		const rig = renderRig(modelExportFolder, textureExportFolder)
		const animations = renderProjectAnimations(Project, rig)

		if (aj.enable_resource_pack) {
			compileResourcePack({
				rig,
				animations,
				displayItemPath,
				resourcePackFolder,
				textureExportFolder,
				modelExportFolder,
				dataPackFolder,
			})
		}

		if (aj.enable_data_pack) {
			compileDataPack({ rig, animations })
		}

		Project.last_used_export_namespace = aj.export_namespace

		saveBlueprint()
		Blockbench.showQuickMessage('Project exported successfully!', 2000)
	} catch (e: any) {
		console.error(e)
		openUnexpectedErrorDialog(e as Error)
	}
}
