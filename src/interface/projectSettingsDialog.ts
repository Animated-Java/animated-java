import { PACKAGE } from '../constants'
import { SvelteDialog } from '../util/svelteDialog'
import { get, writable } from 'svelte/store'
import { injectSvelteCompomponent } from '../util/injectSvelte'
import ProjectSettingsDialogSvelteComponent from '../components/projectSettingsDialog.svelte'
import ProjectSettingsDialogTitleSvelteComponent from '../components/projectSettingsDialogTitle.svelte'

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

export function openProjectSettingsDialog() {
	if (!Project) return

	const blueprintName = writable(Project.name)
	const exportNamespace = writable(Project.animated_java.export_namespace)
	const textureSizeX = writable(Project.texture_width)
	const textureSizeY = writable(Project.texture_height)
	const exportMode = writable(Project.animated_java.export_mode)
	// Resource Pack Settings
	const displayItem = writable(Project.animated_java.display_item)
	const enableAdvancedResourcePackSettings = writable(
		Project.animated_java.enable_advanced_resource_pack_settings
	)
	const resourcePack = writable(Project.animated_java.resource_pack)
	// Data Pack Settings
	const enableAdvancedDataPackSettings = writable(
		Project.animated_java.enable_advanced_data_pack_settings
	)
	const dataPack = writable(Project.animated_java.data_pack)

	new SvelteDialog({
		id: `${PACKAGE.name}:projectSettingsDialog`,
		title: 'Project Settings',
		width: 512,
		svelteComponent: ProjectSettingsDialogSvelteComponent,
		svelteComponentProps: {
			blueprintName,
			exportNamespace,
			textureSizeX,
			textureSizeY,
			exportMode,
			displayItem,
			enableAdvancedResourcePackSettings,
			resourcePack,
			enableAdvancedDataPackSettings,
			dataPack,
		},
		onOpen() {
			injectTitle()
		},
		onConfirm() {
			if (!Project) return
			Project.name = get(blueprintName)
			Project.animated_java.export_namespace = get(exportNamespace)
			Project.texture_width = get(textureSizeX)
			Project.texture_height = get(textureSizeY)
			Project.animated_java.export_mode = get(exportMode)
			// Resource Pack Settings
			Project.animated_java.display_item = get(displayItem)
			Project.animated_java.enable_advanced_resource_pack_settings = get(
				enableAdvancedResourcePackSettings
			)
			Project.animated_java.resource_pack = get(resourcePack)
			// Data Pack Settings
			Project.animated_java.enable_advanced_data_pack_settings = get(
				enableAdvancedDataPackSettings
			)
			Project.animated_java.data_pack = get(dataPack)
			console.log('Successfully saved project settings', Project)
		},
	}).show()
}
