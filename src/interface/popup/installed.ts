import InstalledPopup from '../../components/installedPopup.svelte'
import { PACKAGE } from '../../constants'
import { SvelteDialog } from '../../util/svelteDialog'
import { translate } from '../../util/translation'

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
