import BlueprintLoadingPopup from '../../components/blueprintLoadingPopup.svelte'
import { PACKAGE } from '../../constants'
import { Valuable } from '../../util/stores'
import { SvelteDialog } from '../../util/svelteDialog'
import { translate } from '../../util/translation'

export const PROGRESS = new Valuable(0)
export const MAX_PROGRESS = new Valuable(1)

let instance: SvelteDialog<BlueprintLoadingPopup> | null

export function openBlueprintLoadingDialog() {
	PROGRESS.set(0)
	MAX_PROGRESS.set(1)

	instance = new SvelteDialog({
		id: `${PACKAGE.name}:blueprintLoadingPopup`,
		title: translate('dialog.blueprint_loading.title'),
		width: 128,
		content: {
			component: BlueprintLoadingPopup,
			props: {
				progress: PROGRESS,
				maxProgress: MAX_PROGRESS,
			},
		},
		preventKeybinds: true,
		buttons: [],
	}).show()

	return instance
}

export function closeBlueprintLoadingDialog() {
	if (instance) {
		instance.close(0)
	}
	instance = null
}
