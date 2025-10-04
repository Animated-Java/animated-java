import KofiPopup from 'src/components/kofiPopup.svelte'
import { updateAllCubeOutlines } from 'src/mods/cube'
import type { MinecraftVersion } from 'src/systems/global'
import BlueprintSettingsDialogSvelteComponent from '../../components/blueprintSettingsDialog.svelte'
import { PACKAGE } from '../../constants'
import { updateRenderBoxPreview, updateRotationLock } from '../../formats/blueprint/format'
import { defaultValues, type ExportMode } from '../../formats/blueprint/settings'
import { sanitizeStorageKey } from '../../util/minecraftUtil'
import { Valuable } from '../../util/stores'
import { SvelteDialog } from '../../util/svelteDialog'
import { translate } from '../../util/translation'

function getSettings() {
	return {
		blueprintName: new Valuable(Project!.name, value => {
			if (!value) {
				return 'My Blueprint'
			}
			return value
		}),
		textureSizeX: new Valuable(Project!.texture_width),
		textureSizeY: new Valuable(Project!.texture_height),
		showRenderBox: new Valuable(Project!.animated_java.show_render_box),
		autoRenderBox: new Valuable(Project!.animated_java.auto_render_box),
		renderBoxX: new Valuable(Project!.animated_java.render_box[0]),
		renderBoxY: new Valuable(Project!.animated_java.render_box[1]),
		// Export Settings
		enablePluginMode: new Valuable(Project!.animated_java.enable_plugin_mode),
		exportNamespace: new Valuable(Project!.animated_java.export_namespace, value => {
			if (!value) {
				return defaultValues.export_namespace
			}
			return sanitizeStorageKey(value)
		}),
		resourcePackExportMode: new Valuable(
			Project!.animated_java.resource_pack_export_mode as string
		),
		dataPackExportMode: new Valuable(Project!.animated_java.data_pack_export_mode as string),
		targetMinecraftVersion: new Valuable(
			Project!.animated_java.target_minecraft_version as string
		),
		// Resource Pack Settings
		displayItem: new Valuable(Project!.animated_java.display_item, value => {
			if (!value) {
				return defaultValues.display_item
			}
			return value
		}),
		customModelDataOffset: new Valuable(Project!.animated_java.custom_model_data_offset),
		enableAdvancedResourcePackSettings: new Valuable(
			Project!.animated_java.enable_advanced_resource_pack_settings
		),
		resourcePack: new Valuable(Project!.animated_java.resource_pack),
		// Data Pack Settings
		enableAdvancedDataPackSettings: new Valuable(
			Project!.animated_java.enable_advanced_data_pack_settings
		),
		dataPack: new Valuable(Project!.animated_java.data_pack),
		onSummonFunction: new Valuable(Project!.animated_java.on_summon_function),
		onRemoveFunction: new Valuable(Project!.animated_java.on_remove_function),
		onPreTickFunction: new Valuable(Project!.animated_java.on_pre_tick_function),
		onPostTickFunction: new Valuable(Project!.animated_java.on_post_tick_function),
		interpolationDuration: new Valuable(Project!.animated_java.interpolation_duration),
		teleportationDuration: new Valuable(Project!.animated_java.teleportation_duration),
		autoUpdateRigOrientation: new Valuable(Project!.animated_java.auto_update_rig_orientation),
		useStorageForAnimation: new Valuable(Project!.animated_java.use_storage_for_animation),
		// Plugin Settings
		bakedAnimations: new Valuable(Project!.animated_java.baked_animations),
		jsonFile: new Valuable(Project!.animated_java.json_file),
	}
}

function setSettings(settings: ReturnType<typeof getSettings>) {
	if (!Project) return
	Project.name = settings.blueprintName.get()

	setProjectResolution(settings.textureSizeX.get(), settings.textureSizeY.get(), true)

	Project.animated_java.show_render_box = settings.showRenderBox.get()
	Project.animated_java.auto_render_box = settings.autoRenderBox.get()
	Project.animated_java.render_box = [settings.renderBoxX.get(), settings.renderBoxY.get()]

	// Export Settings
	Project.animated_java.enable_plugin_mode = settings.enablePluginMode.get()
	Project.pluginMode.set(settings.enablePluginMode.get()) // Required to update the project title.
	Project.animated_java.export_namespace = settings.exportNamespace.get()
	Project.animated_java.resource_pack_export_mode =
		settings.resourcePackExportMode.get() as ExportMode
	Project.animated_java.data_pack_export_mode = settings.dataPackExportMode.get() as ExportMode
	Project.animated_java.target_minecraft_version =
		settings.targetMinecraftVersion.get() as MinecraftVersion
	// Resource Pack Settings
	Project.animated_java.display_item = settings.displayItem.get()
	Project.animated_java.custom_model_data_offset = settings.customModelDataOffset.get()
	Project.animated_java.enable_advanced_resource_pack_settings =
		settings.enableAdvancedResourcePackSettings.get()
	Project.animated_java.resource_pack = settings.resourcePack.get()
	// Data Pack Settings
	Project.animated_java.enable_advanced_data_pack_settings =
		settings.enableAdvancedDataPackSettings.get()
	Project.animated_java.data_pack = settings.dataPack.get()
	Project.animated_java.on_summon_function = settings.onSummonFunction.get()
	Project.animated_java.on_remove_function = settings.onRemoveFunction.get()
	Project.animated_java.on_pre_tick_function = settings.onPreTickFunction.get()
	Project.animated_java.on_post_tick_function = settings.onPostTickFunction.get()
	Project.animated_java.interpolation_duration = settings.interpolationDuration.get()
	Project.animated_java.teleportation_duration = settings.teleportationDuration.get()
	Project.animated_java.auto_update_rig_orientation = settings.autoUpdateRigOrientation.get()
	Project.animated_java.use_storage_for_animation = settings.useStorageForAnimation.get()
	// Plugin Settings
	Project.animated_java.baked_animations = settings.bakedAnimations.get()
	Project.animated_java.json_file = settings.jsonFile.get()
	console.log('Successfully saved project settings', Project)
}

export function openBlueprintSettingsDialog() {
	if (!Project) return

	const settings = getSettings()
	return new SvelteDialog({
		id: `${PACKAGE.name}:blueprintSettingsDialog`,
		title: translate('dialog.blueprint_settings.title'),
		width: 800,
		content: {
			component: BlueprintSettingsDialogSvelteComponent,
			props: settings,
		},
		extra: {
			component: KofiPopup,
		},
		contentStyle: {
			marginTop: '10px',
		},
		preventKeybinds: true,
		onConfirm() {
			setSettings(settings)
			updateRenderBoxPreview()
			updateRotationLock()
			updateAllCubeOutlines()
			Canvas.updateAll()
		},
	}).show()
}
