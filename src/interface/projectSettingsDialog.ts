import { PACKAGE } from '../constants'
import { SvelteDialog } from '../util/svelteDialog'
import ProjectSettingsDialogSvelteComponent from '../components/projectSettingsDialog.svelte'
import { get, writable } from 'svelte/store'

export function openProjectSettingsDialog() {
	if (!Project) return

	const projectName = writable(Project.name)
	const textureSizeX = writable(Project.texture_width)
	const textureSizeY = writable(Project.texture_height)

	new SvelteDialog({
		id: `${PACKAGE.name}:projectSettingsDialog`,
		title: 'Project Settings',
		width: 400,
		svelteComponent: ProjectSettingsDialogSvelteComponent,
		svelteComponentProps: {
			projectName,
			textureSizeX,
			textureSizeY,
		},
		onConfirm() {
			if (!Project) return
			console.log('Saving Project setting changes.')
			Project.name = get(projectName)
			if (Project.name === '') {
				Project.name = 'untitled_project'
			}
			Project.texture_width = get(textureSizeX)
			Project.texture_height = get(textureSizeY)
		},
	}).show()
}
