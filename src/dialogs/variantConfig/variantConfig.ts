import { observable } from 'svelte-observable-store'
import { SvelteDialog } from 'svelte-patching-tools/blockbench'
import { PACKAGE } from '../../constants'
import EVENTS from '../../util/events'
import { localize as translate } from '../../util/lang'
import { Variant } from '../../variants'
import VariantConfigDialogSvelteComponent from './variantConfig.svelte'

export function openVariantConfigDialog(variant: Variant) {
	const displayName = observable(variant.displayName)
	const name = observable(variant.name)
	const uuid = observable(variant.uuid)
	const textureMap = variant.textureMap.copy()
	const generateNameFromDisplayName = observable(variant.generateNameFromDisplayName)
	const excludedNodes = observable(variant.excludedNodes)

	new SvelteDialog({
		id: `${PACKAGE.name}:variantConfig`,
		title: translate('dialog.variant_config.title'),
		width: 700,
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
		disableKeybinds: true,
		onConfirm() {
			variant.displayName = displayName.get()
			variant.name = name.get()
			variant.uuid = uuid.get()
			variant.textureMap = textureMap
			variant.generateNameFromDisplayName = generateNameFromDisplayName.get()
			variant.excludedNodes = excludedNodes.get()
			EVENTS.UPDATE_VARIANT.publish(variant)
			variant.select()

			Project!.saved = false
		},
	}).show()
}
