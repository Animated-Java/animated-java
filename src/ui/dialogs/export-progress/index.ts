import { PACKAGE } from '../../../constants'
import { Syncable } from '../../../util/stores'
import { SvelteDialog } from '../../../util/svelteDialog'
import { translate } from '../../../util/translation'
import ExportProgressDialogSvelteComponent from './exportProgressDialog.svelte'

export const PROGRESS = new Syncable(0)
export const MAX_PROGRESS = new Syncable(1)
export const PROGRESS_DESCRIPTION = new Syncable('')

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
		preventKeybinds: true,
		buttons: [],
	}).show()
	return dialog
}
