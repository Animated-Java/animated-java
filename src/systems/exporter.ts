import { saveBlueprint } from '../blueprintFormat'
import { blueprintSettingErrors } from '../blueprintSettings'
import { openBlueprintSettingsDialog } from '../interface/blueprintSettingsDialog'
import { PROGRESS_DESCRIPTION, openExportProgressDialog } from '../interface/exportProgressDialog'
import { openUnexpectedErrorDialog } from '../interface/unexpectedErrorDialog'
import { resolvePath } from '../util/fileUtil'
import { translate } from '../util/translation'
import { Variant } from '../variants'
import { hashAnimations, renderProjectAnimations } from './animationRenderer'
import { compileDataPack } from './datapackCompiler'
import { exportJSON } from './jsonCompiler'
import { compileResourcePack } from './resourcepackCompiler'
import { renderRig, hashRig } from './rigRenderer'

export class IntentionalExportError extends Error {}

async function actuallyExportProject(forceSave = true) {
	const aj = Project!.animated_java
	const dialog = openExportProgressDialog()
	// Wait for the dialog to open
	await new Promise(resolve => requestAnimationFrame(resolve))
	const selectedVariant = Variant.selected
	Variant.getDefault().select()
	try {
		console.time('Exporting project took')

		let textureExportFolder: string, modelExportFolder: string, displayItemPath: string

		const resourcePackFolder = resolvePath(aj.resource_pack)
		const dataPackFolder = resolvePath(aj.data_pack)

		if (aj.enable_plugin_mode) {
			modelExportFolder = PathModule.join(
				'assets/animated_java/models/item/',
				aj.export_namespace
			)
			textureExportFolder = PathModule.join(
				'assets/animated_java/textures/item/',
				aj.export_namespace
			)
			displayItemPath = PathModule.join(
				'assets/minecraft/models/item/',
				aj.display_item.split(':').at(-1)! + '.json'
			)
		} else if (aj.enable_advanced_resource_pack_settings) {
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

		PROGRESS_DESCRIPTION.set('Rendering Rig...')
		const rig = renderRig(modelExportFolder, textureExportFolder)

		if (
			Project!.animated_java.resource_pack_export_mode === 'none' &&
			rig.includes_custom_models
		) {
			Blockbench.showMessageBox({
				title: translate('misc.failed_to_export.title'),
				message: translate('misc.failed_to_export.custom_models.message'),
				buttons: [translate('misc.failed_to_export.button')],
			})
			dialog.close(0)
			return
		}

		PROGRESS_DESCRIPTION.set('Rendering Animations...')
		const animations = renderProjectAnimations(Project!, rig)

		PROGRESS_DESCRIPTION.set('Hashing Rendered Objects...')
		const rigHash = hashRig(rig)
		const animationHash = hashAnimations(animations)

		// Always run the resource pack compiler because it calculates the custom model data.
		await compileResourcePack({
			rig,
			displayItemPath,
			resourcePackFolder,
			textureExportFolder,
			modelExportFolder,
		})

		if (aj.enable_plugin_mode) {
			exportJSON({
				rig,
				animations,
				displayItemPath,
				textureExportFolder,
				modelExportFolder,
			})
		} else {
			if (aj.data_pack_export_mode !== 'none') {
				await compileDataPack({ rig, animations, dataPackFolder, rigHash, animationHash })
			}

			Project!.last_used_export_namespace = aj.export_namespace
		}

		console.timeEnd('Exporting project took')

		if (forceSave) saveBlueprint()
		Blockbench.showQuickMessage('Project exported successfully!', 2000)
	} catch (e: any) {
		console.error(e)
		if (e instanceof IntentionalExportError) {
			Blockbench.showMessageBox({
				title: translate('misc.failed_to_export.title'),
				message: e.message,
				buttons: [translate('misc.failed_to_export.button')],
			})
			return
		}
		openUnexpectedErrorDialog(e as Error)
	} finally {
		selectedVariant?.select()
		dialog.close(0)
	}
}

export async function exportProject(forceSave = true) {
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
				translate('misc.failed_to_export.blueprint_settings.message') +
				'\n\n' +
				Object.entries(blueprintSettingErrors.get())
					.map(
						v =>
							translate('misc.failed_to_export.blueprint_settings.error_item', v[0]) +
							'\n - ' +
							v[1]
					)
					.join('\n\n'),
			buttons: [translate('misc.failed_to_export.button')],
		})
		return
	}

	settingsDialog.close(0)

	// Verify that all textures have unique IDs

	await actuallyExportProject(forceSave)
}
