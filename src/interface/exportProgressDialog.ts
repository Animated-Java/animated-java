import ExportProgressDialogSvelteComponent from '../components/exportProgressDialog.svelte'
import { PACKAGE } from '../constants'
import { Valuable } from '../util/stores'
import { SvelteDialog } from '../util/svelteDialog'
import { translate } from '../util/translation'

const LOG = new Valuable('')

export function openExportProgressDialog() {
	const originalLog = console.log
	LOG.set('')

	function logMessage(...messages: any[]) {
		const current = LOG.get()
		LOG.set(current + messages.join(' ') + '\n')
		originalLog(...(messages as string[]))
	}
	console.log = logMessage

	const dialog = new SvelteDialog({
		id: `${PACKAGE.name}:exportProgressDialog`,
		title: translate('dialog.export_progress.title'),
		width: 512,
		svelteComponent: ExportProgressDialogSvelteComponent,
		svelteComponentProperties: {
			log: LOG,
		},
		preventKeybinds: true,
		buttons: [],
		onClose: () => {
			console.log = originalLog
		},
	}).show()
	return dialog
}
