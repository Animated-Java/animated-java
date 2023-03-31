import { translate } from '../../util/translation'
import { SvelteDialog } from '../util/svelteDialog'
import UnexpectedError from '../components/popups/unexpectedError.svelte'

export function openUnexpectedErrorDialog(error: any) {
	return new SvelteDialog({
		title: translate('animated_java.popup.unexpectedError.title'),
		id: 'animated_java:popup.invalid_cubes',
		width: 700,
		stackable: true,
		buttons: [translate('animated_java.popup.close_button')],
		svelteComponent: UnexpectedError,
		svelteComponentProps: { error },
	}).show()
}
