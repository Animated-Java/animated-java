import { ajModelFormat } from '../modelFormat'
import { createAction } from '../util/moddingTools'
import { translate } from '../util/translation'
import { SvelteDialog } from './util/svelteDialog'
import LocatorConfigComponent from './components/locatorConfig.svelte'

export function openAJLocatorConfigDialog() {
	new SvelteDialog({
		id: 'aj_bone_config',
		title: translate('animated_java.dialog.locator_config'),
		width: 600,
		svelteComponent: LocatorConfigComponent,
		svelteComponentProps: { locator: Locator.selected.at(0) },
	}).show()
}

export const LOCATOR_CONFIG_ACTION = createAction('animated_java:locator_config', {
	icon: 'settings',
	name: translate('animated_java.menubar.items.locator_config'),
	condition: () => Format === ajModelFormat,
	click: () => {
		openAJLocatorConfigDialog()
	},
})
