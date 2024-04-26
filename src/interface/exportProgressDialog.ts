import ExportProgressDialogSvelteComponent from '../components/exportProgressDialog.svelte'
import { PACKAGE } from '../constants'
import { Valuable } from '../util/stores'
import { SvelteDialog } from '../util/svelteDialog'
import { translate } from '../util/translation'
import { inspect } from 'util'

export const LOG = new Valuable('')
export const PROGRESS = new Valuable(0)
export const MAX_PROGRESS = new Valuable(1)

export function openExportProgressDialog(debug?: boolean) {
	const originalLog = console.log
	LOG.set('')
	PROGRESS.set(0)
	MAX_PROGRESS.set(1)

	function logMessage(...messages: any[]) {
		const current = LOG.get()
		const strings = []
		for (const item of messages) {
			switch (typeof item) {
				case 'object':
					strings.push(inspect(item))
					break
				default:
					strings.push(item)
					break
			}
		}
		LOG.set(current + strings.join(' ') + '\n')
		originalLog(...(messages as string[]))
	}
	console.log = logMessage

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
		svelteComponent: ExportProgressDialogSvelteComponent,
		svelteComponentProperties: {
			log: LOG,
			progress: PROGRESS,
			maxProgress: MAX_PROGRESS,
		},
		preventKeybinds: true,
		buttons: [],
		onClose: () => {
			console.log = originalLog
		},
	}).show()
	return dialog
}
