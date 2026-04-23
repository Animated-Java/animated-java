import { observable } from 'svelte-observable-store'
import { SvelteDialog } from 'svelte-patching-tools/blockbench'
import { PACKAGE } from '../../constants'
import { localize as translate } from '../../util/lang'
import ExportProgressDialogSvelteComponent from './exportProgress.svelte'

export const PROGRESS = observable(0)
export const MAX_PROGRESS = observable(1)
export const PROGRESS_DESCRIPTION = observable('')

export function openExportProgressDialog(debug?: boolean) {
	PROGRESS.set(0)
	MAX_PROGRESS.set(1)
	PROGRESS_DESCRIPTION.set('Preparing...')

	if (debug) {
		MAX_PROGRESS.set(1000)
		setInterval(() => {
			// logMessage('Debug:', Math.random())
			PROGRESS.set(PROGRESS.get() + 1)
			if (PROGRESS.get() >= MAX_PROGRESS.get()) {
				PROGRESS.set(0)
			}
		}, 10)
	}

	const dialog = new SvelteDialog({
		id: `${PACKAGE.name}:exportProgressDialog`,
		title: translate('dialog.export_progress.title'),
		width: 512,
		component: ExportProgressDialogSvelteComponent,
		props: {
			progress: PROGRESS,
			maxProgress: MAX_PROGRESS,
			progressDescription: PROGRESS_DESCRIPTION,
		},
		disableKeybinds: true,
		buttons: [],
	}).show()
	return dialog
}
