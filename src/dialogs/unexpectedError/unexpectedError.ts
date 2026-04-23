import { SvelteDialog } from 'svelte-patching-tools/blockbench'
import { PACKAGE } from '../../constants'
import { localize as translate } from '../../util/lang'
import UnexpectedErrorDialog from './unexpectedError.svelte'

export function openUnexpectedErrorDialog(error: Error) {
	new SvelteDialog({
		id: `${PACKAGE.name}:unexpectedError`,
		title: translate('dialog.unexpected_error.title'),
		width: 600,
		component: UnexpectedErrorDialog,
		props: { error },
		disableKeybinds: true,
		buttons: [translate('dialog.unexpected_error.close_button')],
	}).show()
}
