import { translate } from '../../util/translation'
import { SvelteDialog } from '../util/svelteDialog'
import FailedProjectExportReadiness from '../components/popups/failedProjectExportReadiness.svelte'
import type { IInfoPopup } from '../../settings'

export function openAjFailedProjectExportReadinessDialog(infos: IInfoPopup[]) {
	return new SvelteDialog({
		title: translate('animated_java.popup.failed_project_export_readiness.title'),
		id: 'animated_java:popup.failed_project_export_readiness',
		width: 600,
		buttons: [translate('animated_java.popup.close_button')],
		svelteComponent: FailedProjectExportReadiness,
		svelteComponentProps: { infos },
	}).show()
}
