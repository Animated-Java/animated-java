import { translate } from '../util/translation'
import { SvelteDialog } from './util/svelteDialog'
import ExportInProgressComponent from './components/exportInProgress.svelte'

export function openAJExportInProgressDialog() {
	const dialog = new SvelteDialog({
		title: translate('animated_java.dialog.export_in_progress.title'),
		id: 'animated_java:export_in_progress',
		width: 600,
		buttons: [],
		svelteComponent: ExportInProgressComponent,
		svelteComponentProps: {},
	}).show()
	open_interface = {} as Dialog
	return dialog
}
