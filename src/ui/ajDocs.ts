import { ajModelFormat } from '../modelFormat'
import { translate } from '../translation'
import { ajAction } from '../util/ajAction'
import { AJDialog } from './ajDialog'
import { default as DocsComponent } from './components/docs.svelte'

function openAjDocsDialog() {
	const dialog = new AJDialog(
		DocsComponent,
		{},
		{
			title: translate('animated_java.dialog.documentation.title'),
			id: 'animated_java.documentation',
			width: 800,
			buttons: [translate('animated_java.dialog.documentation.close_button')],
		}
	)
	dialog.show()
}

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
