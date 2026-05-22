import { registerDeletableHandlerPatch } from 'blockbench-patch-manager'
import { SvelteDialog } from 'svelte-patching-tools/blockbench'
import { PACKAGE } from '../../constants'
import {
	activeProjectIsBlueprintFormat,
	projectTargetVersionIsAtLeast,
} from '../../formats/blueprint'
import { localize } from '../../util/lang'
import ItemModelProperties from './itemModelProperties.svelte'

export function openItemPropertiesDialog(group: Group) {
	const itemTints = group.itemModelProperties?.tints ?? []

	new SvelteDialog({
		id: `${PACKAGE.name}:itemProperties`,
		title: localize('dialog.item_properties.title'),
		width: 800,
		component: ItemModelProperties,
		props: {
			itemTints,
		} as any,
		disableKeybinds: true,
		onConfirm() {
			if (itemTints.length === 0) {
				delete group.itemModelProperties
				return
			}

			group.itemModelProperties = {
				tints: [...itemTints],
			}
		},
	}).show()
}

registerDeletableHandlerPatch({
	id: `animated_java:action/item-model-properties`,
	dependencies: [`animated_java:action/open-display-entity-config`],
	create() {
		// @ts-expect-error - Broken BB types
		const action = new Blockbench.Action(`animated_java:action/item-model-properties`, {
			icon: 'settings',
			name: localize('action.open_item_model_properties.name'),
			condition: () =>
				activeProjectIsBlueprintFormat() &&
				projectTargetVersionIsAtLeast('1.21.4') &&
				Group.first_selected?.children.some(child => child instanceof Cube),
			click: () => {
				const group = Group.first_selected
				if (!group) return
				openItemPropertiesDialog(group)
			},
		})

		Group.prototype.menu!.structure.splice(6, 0, '_')
		Group.prototype.menu!.addAction(action, 7)

		return action
	},
})
