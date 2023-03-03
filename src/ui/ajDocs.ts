import { ajModelFormat } from '../modelFormat'
import { translate } from '../util/translation'
import { SvelteDialog } from './svelteDialog'
import { default as DocsComponent } from './components/docs.svelte'
import * as events from '../util/events'
import { createAction } from '../util/moddingTools'

let docsDialog: SvelteDialog | undefined
export function openAjDocsDialog(link?: string, section?: string) {
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
		svelteComponentProps: { page: link, section },
		buttons: [translate('animated_java.dialog.close_button')],
		onButton: () => {
			docsDialog = undefined
		},
	}).show()
}

queueMicrotask(() => {
	MenuBar.addAction(
		createAction('animated_java:documentation', {
			icon: 'find_in_page',
			category: 'animated_java',
			name: translate('animated_java.menubar.items.documentation'),
			condition: () => Format === ajModelFormat,
			click: function () {
				openAjDocsDialog()
			},
		}),
		'animated_java'
	)
})
