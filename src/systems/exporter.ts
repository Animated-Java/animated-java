import { renderProjectAnimations } from './animationRenderer'
import { compileDataPack } from './datapackCompiler'
import { renderRig } from './rigRenderer'

export function exportProject() {
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
			'assets/animated_java/models/',
			aj.export_namespace
		)
		textureExportFolder = PathModule.join(
			resourcePackFolder,
			'assets/animated_java/textures/',
			aj.export_namespace
		)
		displayItemPath = PathModule.join(
			resourcePackFolder,
			'assets/minecraft/models/item/',
			aj.display_item + '.json'
		)
	}

	const rig = renderRig(modelExportFolder, textureExportFolder)
	const animations = renderProjectAnimations(Project, rig)

	compileDataPack(rig, animations)
}
