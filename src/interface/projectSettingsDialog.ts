import { PACKAGE } from '../constants'
import { SvelteDialog } from '../util/svelteDialog'
import { Valuable } from '../util/stores'
import { injectSvelteCompomponent } from '../util/injectSvelte'
import ProjectSettingsDialogSvelteComponent from '../components/projectSettingsDialog.svelte'
import ProjectSettingsDialogTitleSvelteComponent from '../components/projectSettingsDialogTitle.svelte'
import { toSafeFuntionName } from '../minecraft'
import { defaultValues } from '../projectSettings'

function injectTitle() {
	injectSvelteCompomponent({
		elementSelector() {
			const dialogTitle = document.querySelectorAll('.dialog_handle')
			if (
				dialogTitle.length > 0 &&
				dialogTitle[0].children.length > 0 &&
				dialogTitle[0].children[0].innerHTML == 'Project Settings'
			) {
				dialogTitle[0].children[0].remove()
				return dialogTitle[0]
			}
		},
		svelteComponent: ProjectSettingsDialogTitleSvelteComponent,
		svelteComponentProperties: {},
	})
}

function getSettings() {
	return {
		blueprintName: new Valuable(Project!.name, value => {
			if (!value) {
				return defaultValues.blueprintName
			}
			return value
		}),
		exportNamespace: new Valuable(Project!.animated_java.export_namespace, value => {
			if (!value) {
				return defaultValues.exportNamespace
			}
			return toSafeFuntionName(value)
		}),
		textureSizeX: new Valuable(Project!.texture_width),
		textureSizeY: new Valuable(Project!.texture_height),
		// Resource Pack Settings
		exportResourcePack: new Valuable(Project!.animated_java.export_resource_pack),
		displayItem: new Valuable(Project!.animated_java.display_item, value => {
			if (!value) {
				return defaultValues.displayItem
			}
			return value
		}),
		enableAdvancedResourcePackSettings: new Valuable(
			Project!.animated_java.enable_advanced_resource_pack_settings
		),
		resourcePack: new Valuable(Project!.animated_java.resource_pack),
		// Data Pack Settings
		exportDataPack: new Valuable(Project!.animated_java.export_data_pack),
		enableAdvancedDataPackSettings: new Valuable(
			Project!.animated_java.enable_advanced_data_pack_settings
		),
		dataPack: new Valuable(Project!.animated_java.data_pack),
	}
}

function setSettings(settings: any) {
	if (!Project) return
	Project.name = settings.blueprintName.get()
	Project.animated_java.export_namespace = settings.exportNamespace.get()
	Project.texture_width = settings.textureSizeX.get()
	Project.texture_height = settings.textureSizeY.get()
	// Resource Pack Settings
	Project.animated_java.export_resource_pack = settings.exportResourcePack.get()
	Project.animated_java.display_item = settings.displayItem.get()
	Project.animated_java.enable_advanced_resource_pack_settings =
		settings.enableAdvancedResourcePackSettings.get()
	Project.animated_java.resource_pack = settings.resourcePack.get()
	// Data Pack Settings
	Project.animated_java.export_data_pack = settings.exportDataPack.get()
	Project.animated_java.enable_advanced_data_pack_settings =
		settings.enableAdvancedDataPackSettings.get()
	Project.animated_java.data_pack = settings.dataPack.get()
	console.log('Successfully saved project settings', Project)
}

export function openProjectSettingsDialog() {
	if (!Project) return

	const settings = getSettings()

	new SvelteDialog({
		id: `${PACKAGE.name}:projectSettingsDialog`,
		title: 'Project Settings',
		width: 512,
		svelteComponent: ProjectSettingsDialogSvelteComponent,
		svelteComponentProps: settings,
		onOpen() {
			injectTitle()
		},
		onConfirm() {
			setSettings(settings)
		},
	}).show()
}
