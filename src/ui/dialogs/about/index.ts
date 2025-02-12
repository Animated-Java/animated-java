import { PACKAGE } from '../../../constants'
import { SvelteDialog } from '../../../util/svelteDialog'
import { translate } from '../../../util/translation'
import AboutSvelte from './about.svelte'

export function openAboutDialog() {
	new SvelteDialog({
		id: `${PACKAGE.name}:aboutDialog`,
		title: translate('dialog.about.title'),
		width: 700,
		component: AboutSvelte,
		props: {},
		buttons: [translate('dialog.about.close_button')],
		preventKeybinds: true,
	}).show()
}
