import { BLUEPRINT_FORMAT } from '../blueprintFormat'
import { LocatorConfig } from '../boneConfig'
import LocatorConfigDialog from '../components/locatorConfigDialog.svelte'
import { PACKAGE } from '../constants'
import { createAction } from '../util/moddingTools'
import { Valuable } from '../util/stores'
import { SvelteDialog } from '../util/svelteDialog'
import { translate } from '../util/translation'
import { Variant } from '../variants'

export function openLocatorConfigDialog(locator: Locator) {
	// Blockbench's JSON stringifier doesn't handle custom toJSON functions, so I'm storing the config JSON in the locator instead of the actual LocatorConfig object
	let locatorConfigJSON = (locator.configs.default ??= new LocatorConfig().toJSON())

	if (Variant.selected && !Variant.selected.isDefault) {
		// Get the variant's config, or create a new one if it doesn't exist
		locatorConfigJSON = locator.configs.variants[Variant.selected.uuid] ??=
			new LocatorConfig().toJSON()
	}

	const locatorConfig = LocatorConfig.fromJSON(locatorConfigJSON)

	const tickingCommands = new Valuable(locatorConfig.tickingCommands)

	new SvelteDialog({
		id: `${PACKAGE.name}:locatorConfig`,
		title: translate('dialog.locator_config.title'),
		width: 600,
		svelteComponent: LocatorConfigDialog,
		svelteComponentProperties: {
			variant: Variant.selected,
			tickingCommands,
		},
		preventKeybinds: true,
		onConfirm() {
			locatorConfig.tickingCommands = tickingCommands.get()

			if (locatorConfig.checkIfEqual(LocatorConfig.fromJSON(locator.configs.default))) {
				// Don't save the variant config if it's the same as the default
				delete locator.configs.variants[Variant.selected!.uuid]
				return
			}

			if (Variant.selected && !Variant.selected.isDefault) {
				locator.configs.variants[Variant.selected.uuid] = locatorConfig.toJSON()
			} else {
				locator.configs.default = locatorConfig.toJSON()
			}
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
