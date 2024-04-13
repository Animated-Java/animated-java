import { PACKAGE } from '../constants'
import { SvelteDialog } from '../util/svelteDialog'
import { Valuable } from '../util/stores'
import { injectSvelteCompomponent } from '../util/injectSvelte'
import BlueprintSettingsDialogSvelteComponent from '../components/blueprintSettingsDialog.svelte'
import BlueprintSettingsDialogTitleSvelteComponent from '../components/blueprintSettingsDialogTitle.svelte'
import { toSafeFuntionName } from '../util/minecraftUtil'
import { defaultValues } from '../blueprintSettings'
import { translate } from '../util/translation'

function injectTitle() {
	injectSvelteCompomponent({
		elementSelector() {
			const dialogTitle = document.querySelectorAll('.dialog_handle')
			if (
				dialogTitle.length > 0 &&
				dialogTitle[0].children.length > 0 &&
				dialogTitle[0].children[0].innerHTML ===
					translate('dialog.blueprint_settings.title')
			) {
				dialogTitle[0].children[0].remove()
				return dialogTitle[0]
			}
		},
		svelteComponent: BlueprintSettingsDialogTitleSvelteComponent,
		svelteComponentProperties: {},
	})
}

function getSettings(): Record<string, Valuable<any>> {
	return {
		blueprintName: new Valuable(Project!.name, value => {
			if (!value) {
				return 'My Blueprint'
			}
			return value
		}),
		exportNamespace: new Valuable(Project!.animated_java.export_namespace, value => {
			if (!value) {
				return defaultValues.export_namespace
			}
			return toSafeFuntionName(value)
		}),
		textureSizeX: new Valuable(Project!.texture_width),
		textureSizeY: new Valuable(Project!.texture_height),
		// Plugin Settings
		enablePluginMode: new Valuable(Project!.animated_java.enable_plugin_mode),
		// Resource Pack Settings
		enableResourcePack: new Valuable(Project!.animated_java.enable_resource_pack),
		displayItem: new Valuable(Project!.animated_java.display_item, value => {
			if (!value) {
				return defaultValues.display_item
			}
			return value
		}),
		customModelDataOffset: new Valuable(Project!.animated_java.customModelDataOffset),
		enableAdvancedResourcePackSettings: new Valuable(
			Project!.animated_java.enable_advanced_resource_pack_settings
		),
		resourcePack: new Valuable(Project!.animated_java.resource_pack),
		displayItemPath: new Valuable(Project!.animated_java.display_item_path),
		modelFolder: new Valuable(Project!.animated_java.model_folder),
		textureFolder: new Valuable(Project!.animated_java.texture_folder),
		// Data Pack Settings
		enableDataPack: new Valuable(Project!.animated_java.enable_data_pack),
		enableAdvancedDataPackSettings: new Valuable(
			Project!.animated_java.enable_advanced_data_pack_settings
		),
		dataPack: new Valuable(Project!.animated_java.data_pack),
		rootEntitySummonCommands: new Valuable(Project!.animated_java.root_entity_summon_commands),
	}
}

function setSettings(settings: any) {
	if (!Project) return
	Project.name = settings.blueprintName.get()
	Project.animated_java.export_namespace = settings.exportNamespace.get()
	Project.texture_width = settings.textureSizeX.get()
	Project.texture_height = settings.textureSizeY.get()
	// Plugin Settings
	Project.animated_java.enable_plugin_mode = settings.enablePluginMode.get()
	// Resource Pack Settings
	Project.animated_java.enable_resource_pack = settings.enableResourcePack.get()
	Project.animated_java.display_item = settings.displayItem.get()
	Project.animated_java.customModelDataOffset = settings.customModelDataOffset.get()
	Project.animated_java.enable_advanced_resource_pack_settings =
		settings.enableAdvancedResourcePackSettings.get()
	Project.animated_java.resource_pack = settings.resourcePack.get()
	Project.animated_java.display_item_path = settings.displayItemPath.get()
	Project.animated_java.model_folder = settings.modelFolder.get()
	Project.animated_java.texture_folder = settings.textureFolder.get()
	// Data Pack Settings
	Project.animated_java.enable_data_pack = settings.enableDataPack.get()
	Project.animated_java.enable_advanced_data_pack_settings =
		settings.enableAdvancedDataPackSettings.get()
	Project.animated_java.data_pack = settings.dataPack.get()
	Project.animated_java.root_entity_summon_commands = settings.rootEntitySummonCommands.get()
	console.log('Successfully saved project settings', Project)
}

export function openBlueprintSettingsDialog() {
	if (!Project) return

	const settings = getSettings()

	new SvelteDialog({
		id: `${PACKAGE.name}:blueprintSettingsDialog`,
		title: translate('dialog.blueprint_settings.title'),
		width: 512,
		svelteComponent: BlueprintSettingsDialogSvelteComponent,
		svelteComponentProperties: settings,
		preventKeybinds: true,
		onOpen() {
			// injectTitle()
		},
		onConfirm() {
			setSettings(settings)
		},
	}).show()
}
