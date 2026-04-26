import { SvelteDialog } from 'svelte-patching-tools/blockbench'
import { PACKAGE } from '../../constants'
import { localize as translate } from '../../util/lang'
import InstalledPopup from './installed.svelte'

export function openInstallPopup() {
	new SvelteDialog({
		id: `${PACKAGE.name}:installedPopup`,
		title: translate('popup.installed_popup.title'),
		width: 700,
		component: InstalledPopup,
		disableKeybinds: true,
		buttons: [translate('popup.installed_popup.close_button')],
	}).show()
}
