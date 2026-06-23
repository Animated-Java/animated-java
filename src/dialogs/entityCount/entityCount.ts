import { SvelteDialog } from 'svelte-patching-tools/blockbench'
import { PACKAGE } from '../../constants'
import { localize as translate } from '../../util/lang'
import EntityCountDialog from './entityCount.svelte'

export const DIALOG_ID = `${PACKAGE.name}:entityCountDialog`

export function openEntityCountDialog() {
	new SvelteDialog({
		id: DIALOG_ID,
		title: translate('dialog.entity_count_dialog.title'),
		width: 400,
		component: EntityCountDialog,
		buttons: [tl('dialog.close')],
		disableKeybinds: true,
	}).show()
}
