import InstalledPopup from '../../components/installedPopup.svelte'
import { PACKAGE } from '../../constants'
import { SvelteDialog } from '../../util/svelteDialog'
import { translate } from '../../util/translation'

export function openInstallPopup() {
	new SvelteDialog({
		id: `${PACKAGE.name}:installedPopup`,
		title: translate('dialog.installed_popup.title'),
		width: 700,
		component: InstalledPopup,
		props: {},
		preventKeybinds: true,
		buttons: [translate('dialog.installed_popup.close_button')],
	}).show()
}
