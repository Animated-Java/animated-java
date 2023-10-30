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

	const projectName = writable(Project.name)
	const textureSizeX = writable(Project.texture_width)
	const textureSizeY = writable(Project.texture_height)
	const exportMode = writable(Project.animated_java.export_mode)

	new SvelteDialog({
		id: `${PACKAGE.name}:projectSettingsDialog`,
		title: 'Project Settings',
		width: 512,
		svelteComponent: ProjectSettingsDialogSvelteComponent,
		svelteComponentProps: {
			projectName,
			textureSizeX,
			textureSizeY,
			exportMode,
		},
		onOpen() {
			injectTitle()
		},
		onConfirm() {
			if (!Project) return
			console.log('Saving Project setting changes.')
			Project.name = get(projectName)
			Project.texture_width = get(textureSizeX)
			Project.texture_height = get(textureSizeY)
			Project.animated_java.export_mode = get(exportMode)
		},
	}).show()
}
