import { translate } from '../../util/translation'
import { SvelteDialog } from '../svelteDialog'
import InvalidCubes from '../components/popups/invalidCubes.svelte'

export function openAjInvalidCubesDialog() {
	return new SvelteDialog({
		title: translate('animated_java.popup.invalid_cubes.title'),
		id: 'animated_java:invalid_cubes_popup',
		width: 400,
		buttons: [translate('animated_java.popup.close_button')],
		svelteComponent: InvalidCubes,
		svelteComponentProps: {},
	}).show()
}
