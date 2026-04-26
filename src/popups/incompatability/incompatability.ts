import { SvelteDialog } from 'svelte-patching-tools/blockbench'
import { PACKAGE } from '../../constants'
import EVENTS from '../../util/events'
import { localize as translate } from '../../util/lang'
import IncompatabilityPopup from './incompatability.svelte'

enum INCOMPATABLE_PLUGINS {
	GECKOLIB_ANIMATION_UTILS = 'animation_utils',
	GECKOLIB = 'geckolib',
}

let currentInstance: SvelteDialog<typeof IncompatabilityPopup> | null = null

export function openIncompatabilityPopup(plugins: BBPlugin[]) {
	if (currentInstance) return
	currentInstance = new SvelteDialog({
		id: `${PACKAGE.name}:incompatabilityPopup`,
		title: translate('popup.incompatability_popup.title'),
		width: 700,
		component: IncompatabilityPopup,
		props: { plugins },
		disableKeybinds: true,
		disableCancelKeybind: true,
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
