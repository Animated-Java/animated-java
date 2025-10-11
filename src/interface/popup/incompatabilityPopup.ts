import EVENTS from 'src/util/events'
import IncompatabilityPopup from '../../components/incompatabilityPopup.svelte'
import { PACKAGE } from '../../constants'
import { SvelteDialog } from '../../util/svelteDialog'
import { translate } from '../../util/translation'

enum INCOMPATABLE_PLUGINS {
	GECKOLIB_ANIMATION_UTILS = 'animation_utils',
}

let currentInstance: SvelteDialog<IncompatabilityPopup> | null = null

export function openIncompatabilityPopup(plugins: BBPlugin[]) {
	if (currentInstance) return
	currentInstance = new SvelteDialog({
		id: `${PACKAGE.name}:incompatabilityPopup`,
		title: translate('popup.incompatability_popup.title'),
		width: 700,
		content: {
			component: IncompatabilityPopup,
			props: { plugins },
		},
		preventKeybinds: true,
		preventKeybindCancel: true,
		buttons: [
			translate('popup.incompatability_popup.button.disable_all'),
			translate('popup.incompatability_popup.button.ignore'),
		],
		onButton: button => {
			if (button === 0) {
				plugins.forEach(plugin => {
					if (plugin.disabled) return
					plugin.toggleDisabled()
				})
			}
		},
		onClose: () => {
			currentInstance = null
		},
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
	return Object.values(INCOMPATABLE_PLUGINS).includes(plugin.id as INCOMPATABLE_PLUGINS)
}

export function checkForIncompatabilities() {
	const incompatiblePlugins = Plugins.all.filter(
		plugin => plugin.installed && !plugin.disabled && isIncompatiblePlugin(plugin)
	)
	if (incompatiblePlugins.length > 0) {
		openIncompatabilityPopup(incompatiblePlugins)
		return true
	}
	return false
}

EVENTS.EXTERNAL_PLUGIN_LOAD.subscribe(() => {
	checkForIncompatabilities()
})
