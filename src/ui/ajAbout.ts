import { translate } from '../util/translation'
import { SvelteDialog } from './util/svelteDialog'
import AboutComponent from './components/about.svelte'

export function openAJAboutDialog() {
	new SvelteDialog({
		title: translate('animated_java.dialog.about.title'),
		id: 'animated_java:about',
		width: 700,
		buttons: [translate('animated_java.dialog.close_button')],
		svelteComponent: AboutComponent,
		svelteComponentProps: {},
	}).show()
}
