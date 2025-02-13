import EVENTS from '@events'
import { PACKAGE } from '../../../constants'
import { Valuable } from '../../../util/stores'
import { SvelteDialog } from '../../../util/svelteDialog'
import { translate } from '../../../util/translation'
import type { Variant } from '../../../variants'
import VariantConfigDialogSvelteComponent from './variantConfigDialog.svelte'

export function openVariantConfigDialog(variant: Variant) {
	const displayName = new Valuable(variant.displayName)
	const name = new Valuable(variant.name)
	const uuid = new Valuable(variant.uuid)
	const textureMap = variant.textureMap.copy()
	const generateNameFromDisplayName = new Valuable(variant.generateNameFromDisplayName)
	const excludedNodes = new Valuable(variant.excludedNodes)

	new SvelteDialog({
		id: `${PACKAGE.name}:variantConfig`,
		title: translate('dialog.variant_config.title'),
		width: 512,
		component: VariantConfigDialogSvelteComponent,
		props: {
			variant,
			displayName,
			name,
			uuid,
			textureMap,
			generateNameFromDisplayName,
			excludedNodes,
		},
		preventKeybinds: true,
		onConfirm() {
			variant.displayName = displayName.get()
			variant.name = name.get()
			variant.uuid = uuid.get()
			variant.textureMap = textureMap
			variant.generateNameFromDisplayName = generateNameFromDisplayName.get()
			variant.excludedNodes = excludedNodes.get()
			EVENTS.UPDATE_VARIANT.dispatch(variant)
			variant.select()
		},
	}).show()
}
