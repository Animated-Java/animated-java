import { fs } from '../constants'
import {
	PROGRESS_DESCRIPTION,
	openExportProgressDialog,
} from '../dialogs/exportProgress/exportProgress'
import { openUnexpectedErrorDialog } from '../dialogs/unexpectedError/unexpectedError'
import { projectTargetVersionIsAtLeast, saveBlueprint } from '../formats/blueprint'
import { validateThisProjectsBlueprintSettings } from '../formats/blueprint/settings'
import { resolvePath } from '../util/fileUtil'
import { localize as translate } from '../util/lang'
import { isResourcePackPath, parseResourceLocation } from '../util/minecraftUtil'
import { scrubUndefined } from '../util/misc'
import { Stopwatch } from '../util/stopwatch'
import { Variant } from '../variants'
import { hashAnimations, renderProjectAnimations } from './animationRenderer'
import compileDataPack from './datapackCompiler'
import { IntentionalExportError } from './errors'
import { exportPluginBlueprint } from './pluginCompiler'
import resourcepackCompiler from './resourcepackCompiler'
import { hashRig, renderRig } from './rigRenderer'
import { isCubeValid } from './util'

export function getExportPaths() {
	const aj = Project!.animated_java

	const resourcePackFolder = resolvePath(aj.resource_pack)
	const dataPackFolder = resolvePath(aj.data_pack)

	const parsed = parseResourceLocation(aj.blueprint_id)

	// These paths are all relative to the resource pack folder
	const modelExportFolder = PathModule.join(
		'assets',
		parsed.namespace,
		'models',
		'blueprint',
		parsed.path
	)
	const textureExportFolder = PathModule.join(
		'assets',
		parsed.namespace,
		'textures',
		'blueprint',
		parsed.path
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

interface ExportProjectOptions {
	forceSave?: boolean
	debugMode?: boolean
}

async function actuallyExportProject({
	forceSave = true,
	debugMode = false,
}: ExportProjectOptions = {}): Promise<boolean> {
	const aj = Project!.animated_java
	const dialog = openExportProgressDialog()
	// Wait for the dialog to open
	await new Promise(resolve => requestAnimationFrame(resolve))
	const selectedVariant = Variant.selected
	Variant.getDefault().select()
	const stopwatch = new Stopwatch('Project Export').start()
	try {
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
			return false
		}

		const animations = await renderProjectAnimations(Project!, rig)

		PROGRESS_DESCRIPTION.set('Hashing Rendered Objects...')
		const rigHash = hashRig(rig)
		const animationHash = hashAnimations(animations)

		// TODO - Plugin mode should run without the resource pack compiler
		// Always run the resource pack compiler because it calculates custom model data.
		await resourcepackCompiler(aj.target_minecraft_version, {
			rig,
			displayItemPath,
			resourcePackFolder,
			textureExportFolder,
			modelExportFolder,
			debugMode,
		})

		if (!aj.enable_plugin_mode && aj.data_pack_export_mode !== 'none') {
			await compileDataPack(aj.target_minecraft_version, {
				rig,
				animations,
				dataPackFolder,
				rigHash,
				animationHash,
				debugMode,
			})
		}

		if (aj.enable_plugin_mode) {
			PROGRESS_DESCRIPTION.set('Exporting Plugin JSON...')
			exportPluginBlueprint({ rig, animations })
		}

		Project!.last_used_blueprint_id = aj.blueprint_id

		if (forceSave) saveBlueprint()
		Blockbench.showQuickMessage('Project exported successfully!', 2000)

		return true
	} catch (e: any) {
		console.error(e)
		if (e instanceof IntentionalExportError) {
			Blockbench.showMessageBox(
				{
					title: translate('misc.failed_to_export.title'),
					message: e.message,
					buttons: [translate('misc.failed_to_export.button')],
					...e.messageBoxOptions,
				},
				e.messageBoxCallback
			)
			return false
		}
		openUnexpectedErrorDialog(e as Error)
	} finally {
		selectedVariant?.select()
		dialog.close(0)
		stopwatch.debug()
	}
	return false
}

export async function exportProject(options?: ExportProjectOptions): Promise<boolean> {
	if (!Project) return false // TODO: Handle this error better

	if (Cube.all.some(cube => isCubeValid(cube) === 'invalid')) {
		Blockbench.showMessageBox({
			title: translate('misc.failed_to_export.title'),
			message: translate(
				projectTargetVersionIsAtLeast('1.21.6')
					? 'misc.failed_to_export.invalid_rotation.message_post_1_21_6'
					: 'misc.failed_to_export.invalid_rotation.message'
			),
			buttons: [translate('misc.failed_to_export.button')],
		})
		return false
	}

	let blueprintSettingErrors = scrubUndefined(await validateThisProjectsBlueprintSettings())
	blueprintSettingErrors = Object.fromEntries(
		Object.entries(blueprintSettingErrors).filter(([, error]) => error.type === 'error')
	)

	if (Object.keys(blueprintSettingErrors).length > 0) {
		Blockbench.showMessageBox({
			title: translate('misc.failed_to_export.title'),
			message:
				translate('misc.failed_to_export.blueprint_settings.message') +
				'\n\n' +
				Object.entries(blueprintSettingErrors)
					.map(
						v =>
							translate('misc.failed_to_export.blueprint_settings.error_item', v[0]) +
							'\n - ' +
							v[1].message
					)
					.join('\n\n'),
			buttons: [translate('misc.failed_to_export.button')],
		})
		return false
	}

	return await actuallyExportProject(options)
}
