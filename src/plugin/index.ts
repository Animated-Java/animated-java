import EVENTS from '@events'
import { PACKAGE } from '../constants'
import { openInstallPopup } from '../ui/popups/installed'

export default function register() {
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
			EVENTS.LOAD.dispatch()
		},
		onunload() {
			EVENTS.UNLOAD.dispatch()
		},
		oninstall() {
			EVENTS.INSTALL.dispatch()
			openInstallPopup()
		},
		onuninstall() {
			EVENTS.UNINSTALL.dispatch()
			Blockbench.showMessageBox({
				title: 'Animated Java has Been Uninstalled!',
				message: 'In order to fully uninstall Animated Java, please restart Blockbench.',
				buttons: ['OK'],
			})
		},
	})
}
