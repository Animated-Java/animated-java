import { ajModelFormat } from '../modelFormat'
import { translate } from '../util/translation'
import { ajAction } from '../util/ajAction'
import { AJDialog } from './ajDialog'
import { default as DocsComponent } from './components/docs.svelte'
import { events } from '../util/events'

// events.onDocsLinkClicked.subscribe(event => {})

let docsDialog: AJDialog | undefined
export function openAjDocsDialog(link?: string, section?: string) {
	if (docsDialog) {
		if (link) {
			events.onDocsLinkClicked.dispatch({ link, section })
			return
		} else docsDialog.close(0)
	}

	docsDialog = new AJDialog(
		DocsComponent,
		{
			firstPage: link,
			openToSection: section,
		},
		{
			title: translate('animated_java.dialog.documentation.title'),
			id: 'animated_java:documentation',
			width: 1000,
			buttons: [translate('animated_java.dialog.documentation.close_button')],
			onConfirm: () => {
				docsDialog = undefined
			},
			onCancel: () => {
				docsDialog = undefined
			},
		}
	).show()
}

queueMicrotask(() => {
	MenuBar.addAction(
		ajAction('animated_java:documentation', {
			icon: 'find_in_page',
			category: 'animated_java',
			name: translate('animated_java.menubar.items.documentation'),
			condition: () => Format.id === ajModelFormat.id,
			click: function () {
				openAjDocsDialog()
			},
		}),
		'animated_java'
	)
})
