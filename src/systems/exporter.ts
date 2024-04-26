import { saveBlueprint } from '../blueprintFormat'
import { blueprintSettingErrors } from '../blueprintSettings'
import { openBlueprintSettingsDialog } from '../interface/blueprintSettingsDialog'
import { openExportProgressDialog } from '../interface/exportProgressDialog'
import { openUnexpectedErrorDialog } from '../interface/unexpectedErrorDialog'
import { resolveEnvVariables } from '../util/misc'
import { translate } from '../util/translation'
import { renderProjectAnimations } from './animationRenderer'
import { compileDataPack } from './datapackCompiler'
import { compileResourcePack } from './resourcepackCompiler'
import { renderRig } from './rigRenderer'

async function actuallyExportProject() {
	const aj = Project!.animated_java
	const dialog = openExportProgressDialog()
	// Wait for the dialog to open
	await new Promise(resolve => requestAnimationFrame(resolve))
	try {
		console.time('Exporting project took')

		let resourcePackFolder: string,
			dataPackFolder: string,
			textureExportFolder: string,
			modelExportFolder: string,
			displayItemPath: string

		resourcePackFolder = resolveEnvVariables(aj.resource_pack)
		dataPackFolder = resolveEnvVariables(aj.data_pack)

		console.log('Exporting to', resourcePackFolder, dataPackFolder)

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
		const animations = renderProjectAnimations(Project!, rig)

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
			await compileDataPack({ rig, animations, dataPackFolder })
		}

		Project!.last_used_export_namespace = aj.export_namespace
		console.timeEnd('Exporting project took')

		saveBlueprint()
		dialog.close(0)
		Blockbench.showQuickMessage('Project exported successfully!', 2000)
	} catch (e: any) {
		console.error(e)
		dialog.close(0)
		openUnexpectedErrorDialog(e as Error)
	}
}

export async function exportProject() {
	if (!Project) return // TODO: Handle this error better
	blueprintSettingErrors.set({})
	const settingsDialog = openBlueprintSettingsDialog()!
	// Wait for the dialog to open
	await new Promise(resolve => requestAnimationFrame(resolve))
	console.log('Blueprint Setting Errors', blueprintSettingErrors.get())
	if (Object.keys(blueprintSettingErrors.get()).length > 0) {
		Blockbench.showMessageBox({
			title: translate('misc.failed_to_export.title'),
			message:
				translate('misc.failed_to_export.message') +
				'\n\n' +
				Object.entries(blueprintSettingErrors.get())
					.map(v => translate('misc.failed_to_export.error_item', v[0]) + '\n - ' + v[1])
					.join('\n\n'),
			buttons: [translate('misc.failed_to_export.button')],
		})
	} else {
		settingsDialog.close(0)
		await actuallyExportProject()
	}
}
