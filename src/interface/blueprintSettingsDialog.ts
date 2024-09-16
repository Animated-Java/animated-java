import { PACKAGE } from '../constants'
import { SvelteSidebarDialog } from '../util/svelteDialog'
import { translate } from '../util/translation'
import { updateBoundingBox } from '../blueprintFormat'
import General from '../components/blueprintSettingsPages/general.svelte'
import Datapack from '../components/blueprintSettingsPages/datapack.svelte'
import { defaultValues } from '../blueprintSettings'
import RequiredAsteriskInform from '../components/sidebarDialogItems/requiredAsteriskInform.svelte'

// function getSettings() {
// 	return {
// 		blueprintName: new Valuable(Project!.name, value => {
// 			if (!value) {
// 				return 'My Blueprint'
// 			}
// 			return value
// 		}),
// 		textureSizeX: new Valuable(Project!.texture_width),
// 		textureSizeY: new Valuable(Project!.texture_height),
// 		showBoundingBox: new Valuable(Project!.animated_java.show_bounding_box),
// 		autoBoundingBox: new Valuable(Project!.animated_java.auto_bounding_box),
// 		boundingBoxX: new Valuable(Project!.animated_java.bounding_box[0]),
// 		boundingBoxY: new Valuable(Project!.animated_java.bounding_box[1]),
// 		// Export Settings
// 		enablePluginMode: new Valuable(Project!.animated_java.enable_plugin_mode),
// 		id: new Valuable(Project!.animated_java.id),
// 		resourcePackExportMode: new Valuable(
// 			Project!.animated_java.resource_pack_export_mode as string
// 		),
// 		dataPackExportMode: new Valuable(Project!.animated_java.data_pack_export_mode as string),
// 		customModelDataOffset: new Valuable(Project!.animated_java.custom_model_data_offset),
// 		enableAdvancedResourcePackSettings: new Valuable(
// 			Project!.animated_java.enable_advanced_resource_pack_settings
// 		),
// 		enableAdvancedResourcePackFolders: new Valuable(
// 			Project!.animated_java.enable_advanced_resource_pack_folders
// 		),
// 		resourcePack: new Valuable(Project!.animated_java.resource_pack),
// 		modelFolder: new Valuable(Project!.animated_java.model_folder),
// 		textureFolder: new Valuable(Project!.animated_java.texture_folder),
// 		// Data Pack Settings
// 		enableAdvancedDataPackSettings: new Valuable(
// 			Project!.animated_java.enable_advanced_data_pack_settings
// 		),
// 		dataPack: new Valuable(Project!.animated_java.data_pack),
// 		summonCommands: new Valuable(Project!.animated_java.summon_commands),
// 		tickingCommands: new Valuable(Project!.animated_java.ticking_commands),
// 		interpolationDuration: new Valuable(Project!.animated_java.interpolation_duration),
// 		teleportationDuration: new Valuable(Project!.animated_java.teleportation_duration),
// 		useStorageForAnimation: new Valuable(Project!.animated_java.use_storage_for_animation),
// 		// Plugin Settings
// 		bakedAnimations: new Valuable(Project!.animated_java.bake_animations),
// 		jsonFile: new Valuable(Project!.animated_java.json_file),
// 	}
// }

// function setSettings(settings: ReturnType<typeof getSettings>) {
// 	if (!Project) return
// 	Project.name = settings.blueprintName.get()

// 	setProjectResolution(settings.textureSizeX.get(), settings.textureSizeY.get(), true)

// 	Project.animated_java.show_bounding_box = settings.showBoundingBox.get()
// 	Project.animated_java.auto_bounding_box = settings.autoBoundingBox.get()
// 	Project.animated_java.bounding_box = [settings.boundingBoxX.get(), settings.boundingBoxY.get()]

// 	// Export Settings
// 	Project.animated_java.enable_plugin_mode = settings.enablePluginMode.get()
// 	Project.pluginMode.set(settings.enablePluginMode.get()) // Required to update the project title.
// 	Project.animated_java.id = settings.id.get()
// 	Project.animated_java.resource_pack_export_mode =
// 		settings.resourcePackExportMode.get() as ExportMode
// 	Project.animated_java.data_pack_export_mode = settings.dataPackExportMode.get() as ExportMode
// 	// Resource Pack Settings
// 	Project.animated_java.custom_model_data_offset = settings.customModelDataOffset.get()
// 	Project.animated_java.enable_advanced_resource_pack_settings =
// 		settings.enableAdvancedResourcePackSettings.get()
// 	Project.animated_java.enable_advanced_resource_pack_folders =
// 		settings.enableAdvancedResourcePackFolders.get()
// 	Project.animated_java.resource_pack = settings.resourcePack.get()
// 	Project.animated_java.model_folder = settings.modelFolder.get()
// 	Project.animated_java.texture_folder = settings.textureFolder.get()
// 	// Data Pack Settings
// 	Project.animated_java.enable_advanced_data_pack_settings =
// 		settings.enableAdvancedDataPackSettings.get()
// 	Project.animated_java.data_pack = settings.dataPack.get()
// 	Project.animated_java.summon_commands = settings.summonCommands.get()
// 	Project.animated_java.ticking_commands = settings.tickingCommands.get()
// 	Project.animated_java.interpolation_duration = settings.interpolationDuration.get()
// 	Project.animated_java.teleportation_duration = settings.teleportationDuration.get()
// 	Project.animated_java.use_storage_for_animation = settings.useStorageForAnimation.get()
// 	// Plugin Settings
// 	Project.animated_java.bake_animations = settings.bakedAnimations.get()
// 	Project.animated_java.json_file = settings.jsonFile.get()
// 	console.log('Successfully saved project settings', Project)
// }

export type BlueprintSettings = typeof defaultValues & { project_name: string }

export function openBlueprintSettingsDialog() {
	if (!Project) return

	const settings = { ...defaultValues, project_name: Project.name }

	return new SvelteSidebarDialog({
		id: `${PACKAGE.name}:blueprintSettingsDialog`,
		title: translate('dialog.blueprint_settings.title'),
		sidebar: {
			pages: {
				general: {
					icon: 'settings',
					label: 'General',
					component: General,
					props: { settings },
				},
				datapack: {
					icon: 'folder',
					label: 'Data Pack',
					component: Datapack,
					props: { settings },
				},
			},
		},
		width: 1024,
		preventKeybinds: true,
		onOpen() {
			const buttonBar = $(
				"dialog[id='animated_java:blueprintSettingsDialog'] .dialog_bar.button_bar"
			).first()
			const anchor = document.createComment('asterisk-mount') as unknown as HTMLElement
			buttonBar.prepend(anchor)
			new RequiredAsteriskInform({
				target: buttonBar[0],
				anchor,
			})
		},
		onConfirm() {
			console.log(settings)
			updateBoundingBox()
		},
	}).show()
}
