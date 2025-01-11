import { BLUEPRINT_FORMAT } from '../../blueprintFormat'
import { LocatorConfig } from '../../nodeConfigs'
import LocatorConfigDialog from '../../components/locatorConfigDialog.svelte'
import { PACKAGE } from '../../constants'
import { createAction } from '../../util/moddingTools'
import { Valuable } from '../../util/stores'
import { SvelteDialog } from '../../util/svelteDialog'
import { translate } from '../../util/translation'

export function openLocatorConfigDialog(locator: Locator) {
	// Blockbench's JSON stringifier doesn't handle custom toJSON functions, so I'm storing the config JSON in the locator instead of the actual LocatorConfig object
	const locatorConfig = LocatorConfig.fromJSON((locator.config ??= new LocatorConfig().toJSON()))

	const useEntity = new Valuable(locatorConfig.useEntity)
	const entityType = new Valuable(locatorConfig.entityType)
	const summonCommands = new Valuable(locatorConfig.summonCommands)
	const tickingCommands = new Valuable(locatorConfig.tickingCommands)

	new SvelteDialog({
		id: `${PACKAGE.name}:locatorConfig`,
		title: translate('dialog.locator_config.title'),
		width: 600,
		component: LocatorConfigDialog,
		props: {
			useEntity,
			entityType,
			summonCommands,
			tickingCommands,
		},
		preventKeybinds: true,
		onConfirm() {
			locatorConfig.useEntity = useEntity.get()
			locatorConfig.entityType = entityType.get()
			locatorConfig.summonCommands = summonCommands.get()
			locatorConfig.tickingCommands = tickingCommands.get()

			locator.config = locatorConfig.toJSON()
		},
	}).show()
}

export const LOCATOR_CONFIG_ACTION = createAction(`${PACKAGE.name}:locator_config`, {
	icon: 'settings',
	name: translate('action.open_locator_config.name'),
	condition: () => Format === BLUEPRINT_FORMAT,
	click: () => {
		const locator = Locator.selected.at(0)
		if (!locator) return
		openLocatorConfigDialog(locator)
	},
})
