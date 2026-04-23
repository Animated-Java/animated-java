import { SvelteDialog } from 'svelte-patching-tools/blockbench'
import { PACKAGE } from '../../constants'
import { localize as translate } from '../../util/lang'
import ChangelogDialog from './changelog.svelte'

export const DIALOG_ID = `${PACKAGE.name}:changelogDialog`

export function openChangelogDialog() {
	new SvelteDialog({
		id: DIALOG_ID,
		title: translate('dialog.changelog_dialog.title'),
		width: 800,
		component: ChangelogDialog,
		buttons: ['OK!'],
		disableKeybinds: true,
	}).show()
}
