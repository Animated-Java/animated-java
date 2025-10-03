import { registerAction } from 'src/util/moddingTools'
import LocatorConfigDialog from '../../components/locatorConfigDialog.svelte'
import { PACKAGE } from '../../constants'
import { activeProjectIsBlueprintFormat } from '../../formats/blueprint/format'
import { LocatorConfig } from '../../nodeConfigs'
import { Valuable } from '../../util/stores'
import { SvelteDialog } from '../../util/svelteDialog'
import { translate } from '../../util/translation'

export function openLocatorConfigDialog(locator: Locator) {
	// Blockbench's JSON stringifier doesn't handle custom toJSON functions, so I'm storing the config JSON in the locator instead of the actual LocatorConfig object
	const locatorConfig = LocatorConfig.fromJSON((locator.config ??= new LocatorConfig().toJSON()))

	const useEntity = new Valuable(locatorConfig.useEntity)
	const entityType = new Valuable(locatorConfig.entityType)
	const syncPassengerRotation = new Valuable(locatorConfig.syncPassengerRotation)
	const onSummonFunction = new Valuable(locatorConfig.onSummonFunction)
	const onTickFunction = new Valuable(locatorConfig.onTickFunction)

	new SvelteDialog({
		id: `${PACKAGE.name}:locatorConfig`,
		title: translate('dialog.locator_config.title'),
		width: 600,
		content: {
			component: LocatorConfigDialog,
			props: {
				useEntity,
				entityType,
				syncPassengerRotation,
				onSummonFunction,
				onTickFunction,
			},
		},
		preventKeybinds: true,
		onConfirm() {
			locatorConfig.useEntity = useEntity.get()
			locatorConfig.entityType = entityType.get()
			locatorConfig.syncPassengerRotation = syncPassengerRotation.get()
			locatorConfig.onSummonFunction = onSummonFunction.get()
			locatorConfig.onTickFunction = onTickFunction.get()

			locator.config = locatorConfig.toJSON()
		},
	}).show()
}

const LOCATOR_CONFIG_ACTION = registerAction(
	{ id: `animated-java:locator-config` },
	{
		icon: 'settings',
		name: translate('action.open_locator_config.name'),
		condition: activeProjectIsBlueprintFormat,
		click: () => {
			const locator = Locator.selected.at(0)
			if (!locator) return
			openLocatorConfigDialog(locator)
		},
	}
)

LOCATOR_CONFIG_ACTION.onCreated(action => {
	Locator.prototype.menu!.addAction(action, '6')
})
