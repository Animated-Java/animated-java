import { PACKAGE } from '../../constants'
import { SvelteDialog } from '../../util/svelteDialog'
import { translate } from '../../util/translation'
import InstalledPopup from './installed.svelte'

export function openInstallPopup() {
	new SvelteDialog({
		id: `${PACKAGE.name}:installedPopup`,
		title: translate('popup.installed_popup.title'),
		width: 700,
		content: {
			component: InstalledPopup,
		},
		preventKeybinds: true,
		buttons: [translate('popup.installed_popup.close_button')],
	}).show()
}
