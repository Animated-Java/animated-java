import * as events from '../events'
import { translate } from '../util/translation'
import { default as DocsComponent } from './components/docs/docsDialog.svelte'
import { SvelteDialog } from './util/svelteDialog'

let docsDialog: SvelteDialog | undefined
export function openAJDocsDialog(link?: string, section?: string) {
	if (docsDialog) {
		if (link) {
			events.DOCS_LINK_CLICKED.dispatch({ link, section })
			return
		} else docsDialog.close(0)
	}

	docsDialog = new SvelteDialog({
		title: translate('animated_java.dialog.documentation.title'),
		id: 'animated_java:documentation',
		width: 1000,
		svelteComponent: DocsComponent,
		svelteComponentProps: { link, section },
		buttons: [translate('animated_java.dialog.close_button')],
		stackable: true,
		onClose: () => {
			docsDialog = undefined
			// console.log('onClose')
		},
	}).show()
}
