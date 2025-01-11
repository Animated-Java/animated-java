import ChangelogDialog from '../../components/changelogDialog.svelte'
import { PACKAGE } from '../../constants'
import { SvelteDialog } from '../../util/svelteDialog'
import { translate } from '../../util/translation'

export const DIALOG_ID = `${PACKAGE.name}:animationPropertiesDialog`

export function openChangelogDialog() {
	new SvelteDialog({
		id: DIALOG_ID,
		title: translate('dialog.changelog_dialog.title'),
		width: 600,
		component: ChangelogDialog,
		props: {},
		buttons: ['OK!'],
		preventKeybinds: true,
	}).show()
}
