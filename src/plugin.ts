import EVENTS from '@events'
import PACKAGE from '@package'

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
		EVENTS.LOAD.publish()
		console.log('Animated Java loaded')
	},
	onunload() {
		EVENTS.UNLOAD.publish()
		console.log('Animated Java unloaded')
	},
	oninstall() {
		EVENTS.INSTALL.publish()
		console.log('Animated Java installed')
	},
	onuninstall() {
		EVENTS.UNINSTALL.publish()
		Blockbench.showMessageBox({
			title: 'Animated Java has Been Uninstalled!',
			message: 'In order to fully uninstall Animated Java, please restart Blockbench.',
			buttons: ['OK'],
		})
	},
})
