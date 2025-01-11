import UnexpectedErrorDialog from '../../components/unexpectedErrorDialog.svelte'
import { PACKAGE } from '../../constants'
import { SvelteDialog } from '../../util/svelteDialog'
import { translate } from '../../util/translation'

export function openUnexpectedErrorDialog(error: Error) {
	new SvelteDialog({
		id: `${PACKAGE.name}:unexpectedError`,
		title: translate('dialog.unexpected_error.title'),
		width: 600,
		component: UnexpectedErrorDialog,
		props: {
			error,
		},
		preventKeybinds: true,
		buttons: [translate('dialog.unexpected_error.close_button')],
	}).show()
}
