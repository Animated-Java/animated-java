import IncompatabilityPopup from '../../components/incompatabilityPopup.svelte'
import { PACKAGE } from '../../constants'
import { SvelteDialog } from '../../util/svelteDialog'
import { translate } from '../../util/translation'

const INCOMPATABLE_PLUGINS = ['animation_utils']

let currentInstance: SvelteDialog<IncompatabilityPopup, any> | null = null

export function openIncompatabilityPopup(plugins: BBPlugin[]) {
	currentInstance = new SvelteDialog({
		id: `${PACKAGE.name}:incompatabilityPopup`,
		title: translate('popup.incompatability_popup.title'),
		width: 700,
		component: IncompatabilityPopup,
		props: { plugins },
		preventKeybinds: true,
		buttons: [],
	}).show()
}

export function closeIncompatabilityPopup() {
	if (currentInstance) {
		currentInstance.hide()
		currentInstance.delete()
		currentInstance = null
	}
}

export function isIncompatiblePlugin(plugin: BBPlugin): boolean {
	return INCOMPATABLE_PLUGINS.includes(plugin.id)
}

export function checkForIncompatabilities() {
	const plugins: BBPlugin[] = []
	for (const plugin of Plugins.all) {
		if (!plugin.installed || plugin.disabled || !isIncompatiblePlugin(plugin)) {
			continue
		}
		plugins.push(plugin)
	}
	if (plugins.length > 0) {
		openIncompatabilityPopup(plugins)
		return true
	}
	return false
}
