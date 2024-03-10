import ExportProgressDialogSvelteComponent from '../components/exportProgressDialog.svelte'
import { PACKAGE } from '../constants'
import { Valuable } from '../util/stores'
import { SvelteDialog } from '../util/svelteDialog'
import { translate } from '../util/translation'

const PROGRESS = new Valuable(0)
const LOG = new Valuable('Hello World!\nLorem Ipsum Dolor Sit Amet\n')

export function setProgress(value: number) {
	PROGRESS.set(value)
}

export function getProgress() {
	return PROGRESS.get()
}

export function logMessage(message: string) {
	const current = LOG.get()
	LOG.set(current + message + '\n')
}

export function openExportProgressDialog() {
	new SvelteDialog({
		id: `${PACKAGE.name}:exportProgressDialog`,
		title: translate('dialog.export_progress.title'),
		width: 512,
		svelteComponent: ExportProgressDialogSvelteComponent,
		svelteComponentProperties: {
			progress: PROGRESS,
			log: LOG,
		},
		preventKeybinds: true,
		buttons: [],
	}).show()
}
