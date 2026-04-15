import { SvelteDialog } from 'svelte-patching-tools/blockbench'
import { PACKAGE } from '../../constants'
import { translate } from '../../util/translation'
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
