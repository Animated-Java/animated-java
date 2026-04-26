import { PACKAGE } from './constants'
import { openInstallPopup } from './popups/installed/installed'
import EVENTS from './util/events'

BBPlugin.register(PACKAGE.name, {
	title: PACKAGE.title,
	author: PACKAGE.author.name,
	description: PACKAGE.description,
	icon: 'icon.svg',
	variant: 'desktop',
	version: PACKAGE.version,
	min_version: PACKAGE.min_blockbench_version,
	tags: ['Minecraft: Java Edition', 'Animation', 'Display Entities'],
	await_loading: true,
	onload() {
		console.log(
			`%cAnimated Java v${PACKAGE.version}`,
			'border: 2px solid #00aced; padding: 4px 8px; font-size: 1.2em;'
		)
		console.log('%cby ' + PACKAGE.author.name, 'font-size: 1.1em;')
		// Wait for plugin system to finish loading plugins.
		requestAnimationFrame(() => {
			EVENTS.PLUGIN_LOAD.publish()
		})
	},
	onunload() {
		EVENTS.PLUGIN_UNLOAD.publish()
	},
	oninstall() {
		EVENTS.PLUGIN_INSTALL.publish()
		openInstallPopup()
	},
	onuninstall() {
		EVENTS.PLUGIN_UNINSTALL.publish()
		Blockbench.showMessageBox({
			title: 'Animated Java has Been Uninstalled!',
			message: 'In order to fully uninstall Animated Java, please restart Blockbench.',
			buttons: ['OK'],
		})
	},
})
