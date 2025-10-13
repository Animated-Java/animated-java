import AboutSvelte from '../../components/about.svelte'
import { PACKAGE } from '../../constants'
import { SvelteDialog } from '../../util/svelteDialog'
import { translate } from '../../util/translation'

export function openAboutDialog() {
	new SvelteDialog({
		id: `${PACKAGE.name}:aboutDialog`,
		title: translate('dialog.about.title'),
		width: 700,
		content: {
			component: AboutSvelte,
		},
		buttons: [translate('dialog.about.close_button')],
		preventKeybinds: true,
	}).show()
}
