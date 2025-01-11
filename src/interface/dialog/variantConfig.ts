import VariantConfigDialogSvelteComponent from '../../components/variantConfigDialog.svelte'
import { PACKAGE } from '../../constants'
import { events } from '../../util/events'
import { Valuable } from '../../util/stores'
import { SvelteDialog } from '../../util/svelteDialog'
import { translate } from '../../util/translation'
import { Variant } from '../../variants'

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
			events.UPDATE_VARIANT.dispatch(variant)
			variant.select()
		},
	}).show()
}
