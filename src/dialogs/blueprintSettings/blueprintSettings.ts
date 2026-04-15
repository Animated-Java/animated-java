import { mount } from 'svelte'
import { observable } from 'svelte-observable-store'
import { SvelteDialog } from 'svelte-patching-tools/blockbench'
import { PACKAGE } from '../../constants'
import { updateRotationConstraints } from '../../formats/blueprint'
import { type ExportMode } from '../../formats/blueprint/settings'
import { updateAllCubeOutlines } from '../../mods/cube'
import { SUPPORTED_MINECRAFT_VERSIONS } from '../../systems/global'
import { translate } from '../../util/translation'
import BlueprintSettings from './blueprintSettings.svelte'
import BlueprintSettingsAds from './blueprintSettingsAds.svelte'

function getSettings() {
	return {
		blueprintName: observable(Project!.name),
		textureSizeX: observable(Project!.texture_width),
		textureSizeY: observable(Project!.texture_height),
		showRenderBox: observable(Project!.animated_java.show_render_box),
		autoRenderBox: observable(Project!.animated_java.auto_render_box),
		renderBoxX: observable(Project!.animated_java.render_box[0]),
		renderBoxY: observable(Project!.animated_java.render_box[1]),
		// Export Settings
		enablePluginMode: observable(Project!.animated_java.enable_plugin_mode),
		exportNamespace: observable(Project!.animated_java.export_namespace),
		resourcePackExportMode: observable(
			Project!.animated_java.resource_pack_export_mode as string
		),
		dataPackExportMode: observable(Project!.animated_java.data_pack_export_mode as string),
		targetMinecraftVersion: observable(
			Project!.animated_java.target_minecraft_version as string
		),
		// Resource Pack Settings
		displayItem: observable(Project!.animated_java.display_item),
		customModelDataOffset: observable(Project!.animated_java.custom_model_data_offset),
		enableAdvancedResourcePackSettings: observable(
			Project!.animated_java.enable_advanced_resource_pack_settings
		),
		resourcePack: observable(Project!.animated_java.resource_pack),
		// Data Pack Settings
		enableAdvancedDataPackSettings: observable(
			Project!.animated_java.enable_advanced_data_pack_settings
		),
		dataPack: observable(Project!.animated_java.data_pack),
		onSummonFunction: observable(Project!.animated_java.on_summon_function),
		onRemoveFunction: observable(Project!.animated_java.on_remove_function),
		onPreTickFunction: observable(Project!.animated_java.on_pre_tick_function),
		onPostTickFunction: observable(Project!.animated_java.on_post_tick_function),
		interpolationDuration: observable(Project!.animated_java.interpolation_duration),
		teleportationDuration: observable(Project!.animated_java.teleportation_duration),
		autoUpdateRigOrientation: observable(Project!.animated_java.auto_update_rig_orientation),
		useStorageForAnimation: observable(Project!.animated_java.use_storage_for_animation),
		// Plugin Settings
		bakedAnimations: observable(Project!.animated_java.baked_animations),
		jsonFile: observable(Project!.animated_java.json_file),
	}
}

function setSettings(settings: ReturnType<typeof getSettings>) {
	if (!Project) return
	Project.name = settings.blueprintName.get()

	Blockbench.setProjectResolution(settings.textureSizeX.get(), settings.textureSizeY.get(), true)

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
		settings.targetMinecraftVersion.get() as SUPPORTED_MINECRAFT_VERSIONS
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
	const dialog = new SvelteDialog({
		id: `${PACKAGE.name}:blueprintSettingsDialog`,
		title: translate('dialog.blueprint_settings.title'),
		width: 800,
		component: BlueprintSettings,
		props: settings,
		onOpen() {
			mount(BlueprintSettingsAds, { target: dialog.object! })
			dialog.object!.style.top = ''
		},
		disableKeybinds: true,
		onConfirm() {
			setSettings(settings)
			updateRotationConstraints()
			updateAllCubeOutlines()
			Canvas.updateAll()
		},
	})
	return dialog.show()
}
