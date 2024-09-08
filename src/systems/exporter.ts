import { saveBlueprint } from '../blueprintFormat'
import { blueprintSettingErrors } from '../blueprintSettings'
import { openBlueprintSettingsDialog } from '../interface/blueprintSettingsDialog'
import { PROGRESS_DESCRIPTION, openExportProgressDialog } from '../interface/exportProgressDialog'
import { openUnexpectedErrorDialog } from '../interface/unexpectedErrorDialog'
import { resolvePath } from '../util/fileUtil'
import { isResourcePackPath } from '../util/minecraftUtil'
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

		// Verify that all variant texture maps are valid
		for (const variant of Variant.all) {
			variant.verifyTextureMap()
		}

		// Verify that all non-external textures have unique names
		for (const texture of Texture.all) {
			if (texture.path && isResourcePackPath(texture.path) && fs.existsSync(texture.path))
				continue
			if (Texture.all.some(t => t !== texture && t.name === texture.name)) {
				throw new IntentionalExportError(
					`Texture name "${texture.name}" is used more than once. Please make sure all textures have unique names.`
				)
			}
		}

		let textureExportFolder: string, modelExportFolder: string

		const resourcePackFolder = resolvePath(aj.resource_pack)
		const dataPackFolder = resolvePath(aj.data_pack)

		if (aj.enable_plugin_mode) {
			modelExportFolder = PathModule.join('assets/animated_java/models/item/', aj.id)
			textureExportFolder = PathModule.join('assets/animated_java/textures/item/', aj.id)
		} else if (aj.enable_advanced_resource_pack_folders) {
			modelExportFolder = aj.model_folder
			textureExportFolder = aj.texture_folder
		} else {
			modelExportFolder = PathModule.join(
				resourcePackFolder,
				'assets/animated_java/models/item/',
				aj.id
			)
			textureExportFolder = PathModule.join(
				resourcePackFolder,
				'assets/animated_java/textures/item/',
				aj.id
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
			resourcePackFolder,
			textureExportFolder,
			modelExportFolder,
		})

		if (aj.enable_plugin_mode) {
			exportJSON({
				rig,
				animations,
				textureExportFolder,
				modelExportFolder,
			})
		} else {
			if (aj.data_pack_export_mode !== 'none') {
				await compileDataPack({ rig, animations, dataPackFolder, rigHash, animationHash })
			}

			Project!.last_used_export_namespace = aj.id
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

	await actuallyExportProject(forceSave)
}
