import { PACKAGE } from '../../constants'
import { SvelteDialog } from '../../util/svelteDialog'
import { translate } from '../../util/translation'
import ChangelogDialog from './changelog.svelte'

export const DIALOG_ID = `${PACKAGE.name}:animationPropertiesDialog`

export function openChangelogDialog() {
	new SvelteDialog({
		id: DIALOG_ID,
		title: translate('dialog.changelog_dialog.title'),
		width: 600,
		content: { component: ChangelogDialog },
		buttons: ['OK!'],
		preventKeybinds: true,
	}).show()
}
