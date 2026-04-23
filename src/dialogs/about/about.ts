import { SvelteDialog } from 'svelte-patching-tools/blockbench'
import { PACKAGE } from '../../constants'
import { localize as translate } from '../../util/lang'
import AboutSvelte from './about.svelte'

export function openAboutDialog() {
	new SvelteDialog({
		id: `${PACKAGE.name}:aboutDialog`,
		title: translate('dialog.about.title'),
		width: 700,
		component: AboutSvelte,
		buttons: [translate('dialog.about.close_button')],
		disableKeybinds: true,
	}).show()
}
