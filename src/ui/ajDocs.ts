import { ajModelFormat } from '../modelFormat'
import { translate } from '../translation'
import { ajAction } from '../util/ajAction'
import { AJDialog } from './ajDialog'
import { default as DocsComponent } from './components/docs.svelte'

let docsDialog: AJDialog | undefined

export function openAjDocsDialog(page?: string, section?: string) {
	if (docsDialog) docsDialog.close(0)
	console.log('aaa', page)

	docsDialog = new AJDialog(
		DocsComponent,
		{
			firstPage: page,
			openToSection: section,
		},
		{
			title: translate('animated_java.dialog.documentation.title'),
			id: 'animated_java.documentation',
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
