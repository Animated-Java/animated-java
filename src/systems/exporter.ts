import { saveBlueprint } from '../blueprintFormat'
import { blueprintSettingErrors } from '../blueprintSettings'
import { openBlueprintSettingsDialog } from '../interface/dialog/blueprintSettings'
import { PROGRESS_DESCRIPTION, openExportProgressDialog } from '../interface/dialog/exportProgress'
import { openUnexpectedErrorDialog } from '../interface/dialog/unexpectedError'
import { resolvePath } from '../util/fileUtil'
import { isResourcePackPath, sortMCVersions } from '../util/minecraftUtil'
import { translate } from '../util/translation'
import { Variant } from '../variants'
import { hashAnimations, renderProjectAnimations } from './animationRenderer'
import compileDataPack from './datapackCompiler'
import resourcepackCompiler from './resourcepackCompiler'
import { hashRig, renderRig } from './rigRenderer'
import { isCubeValid } from './util'
import { exportJSON } from './jsonCompiler'

export class IntentionalExportError extends Error {}

export function getExportPaths() {
	const aj = Project!.animated_java

	const resourcePackFolder = resolvePath(aj.resource_pack)
	const dataPackFolder = resolvePath(aj.data_pack)

	// These paths are all relative to the resource pack folder
	const modelExportFolder = PathModule.join(
		'assets/animated_java/models/blueprint/',
		aj.export_namespace
	)
	const textureExportFolder = PathModule.join(
		'assets/animated_java/textures/blueprint/',
		aj.export_namespace
	)
	const displayItemPath = PathModule.join(
		'assets/minecraft/models/item/',
		aj.display_item.split(':').at(-1)! + '.json'
	)

	return {
		resourcePackFolder,
		dataPackFolder,
		textureExportFolder,
		modelExportFolder,
		displayItemPath,
	}
}

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

		// Sort target versions
		console.log('Target Minecraft Versions', aj.target_minecraft_versions)
		aj.target_minecraft_versions = sortMCVersions(aj.target_minecraft_versions)
		console.log('Sorted Target Minecraft Versions', aj.target_minecraft_versions)

		const {
			resourcePackFolder,
			dataPackFolder,
			textureExportFolder,
			modelExportFolder,
			displayItemPath,
		} = getExportPaths()

		PROGRESS_DESCRIPTION.set('Rendering Rig...')
		const rig = renderRig(modelExportFolder, textureExportFolder)

		if (!rig.includes_custom_models && Texture.all.length !== 0) {
			throw new IntentionalExportError(
				translate('misc.failed_to_export.rig_has_textures_but_no_custom_models.message')
			)
		} else if (rig.includes_custom_models && Texture.all.length === 0) {
			throw new IntentionalExportError(
				translate('misc.failed_to_export.rig_has_custom_models_but_no_textures.message')
			)
		}

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

		const animations = await renderProjectAnimations(Project!, rig)

		PROGRESS_DESCRIPTION.set('Hashing Rendered Objects...')
		const rigHash = hashRig(rig)
		const animationHash = hashAnimations(animations)

		// Always run the resource pack compiler because it calculates the custom model data.
		await resourcepackCompiler(aj.target_minecraft_versions, {
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
		} else if (aj.data_pack_export_mode !== 'none') {
			await compileDataPack(aj.target_minecraft_versions, {
				rig,
				animations,
				dataPackFolder,
				rigHash,
				animationHash,
			})
		}

		Project!.last_used_export_namespace = aj.export_namespace
		console.timeEnd('Exporting project took')

		if (forceSave) saveBlueprint()
		Blockbench.showQuickMessage('Project exported successfully!', 2000)

		return
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

	if (
		// Check if 1.21.3 is newer than the target version
		// compareVersions('1.21.3', Project.animated_java.target_minecraft_versions) &&
		!Cube.all.allAre(c => isCubeValid(c))
	) {
		Blockbench.showMessageBox({
			title: translate('misc.failed_to_export.title'),
			message: translate('misc.failed_to_export.invalid_rotation.message'),
			buttons: [translate('misc.failed_to_export.button')],
		})
		return
	}

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
