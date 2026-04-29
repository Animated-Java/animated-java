import { registerDeletableHandlerPatch } from 'blockbench-patch-manager'
import { observable } from 'svelte-observable-store'
import { SvelteDialog } from 'svelte-patching-tools/blockbench'
import { PACKAGE } from '../../constants'
import { activeProjectIsBlueprintFormat } from '../../formats/blueprint'
import { LocatorConfig } from '../../nodeConfigs'
import { localize as translate } from '../../util/lang'
import LocatorConfigDialog from './locatorConfig.svelte'

// TODO - Make on-tick function work without requiring use-entity.

export function openLocatorConfigDialog(locator: Locator) {
	// Blockbench's JSON stringifier doesn't handle custom toJSON functions, so I'm storing the config JSON in the locator instead of the actual LocatorConfig object
	const locatorConfig = LocatorConfig.fromJSON((locator.config ??= new LocatorConfig().toJSON()))

	const useEntity = observable(locatorConfig.useEntity)
	const entityType = observable(locatorConfig.entityType)
	const syncPassengerRotation = observable(locatorConfig.syncPassengerRotation)
	const onSummonFunction = observable(locatorConfig.onSummonFunction)
	const onRemoveFunction = observable(locatorConfig.onRemoveFunction)
	const onTickFunction = observable(locatorConfig.onTickFunction)

	new SvelteDialog({
		id: `${PACKAGE.name}:locatorConfig`,
		title: translate('dialog.locator_config.title'),
		width: 800,
		component: LocatorConfigDialog,
		props: {
			useEntity,
			entityType,
			syncPassengerRotation,
			onSummonFunction,
			onRemoveFunction,
			onTickFunction,
		},
		disableKeybinds: true,
		onConfirm() {
			locatorConfig.useEntity = useEntity.get()
			locatorConfig.entityType = entityType.get()
			locatorConfig.syncPassengerRotation = syncPassengerRotation.get()
			locatorConfig.onSummonFunction = onSummonFunction.get()
			locatorConfig.onRemoveFunction = onRemoveFunction.get()
			locatorConfig.onTickFunction = onTickFunction.get()

			locator.config = locatorConfig.toJSON()
		},
	}).show()
}

registerDeletableHandlerPatch({
	id: `animated_java:action/locator-config`,
	create() {
		// @ts-expect-error - Broken BB types
		const action = new Blockbench.Action(`animated_java:action/locator-config`, {
			icon: 'settings',
			name: translate('action.open_locator_config.name'),
			condition: activeProjectIsBlueprintFormat,
			click: () => {
				const locator = Locator.selected.at(0)
				if (!locator) return
				openLocatorConfigDialog(locator)
			},
		})
		Locator.prototype.menu!.addAction(action, '6')
		return action
	},
})
