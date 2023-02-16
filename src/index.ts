import {
	svelteHelperLogCollectedNodes,
	svelteHelperMarkPluginInitialization,
	svelteHelperMarkPluginInitializationComplete,
} from './svelteFixup'

svelteHelperMarkPluginInitialization()
// KEEP CODE WITHIN THESE BOUNDS

import PACKAGE from '../package.json'
import { events } from './events'
import './mods'
// import x from './ui/test.svelte'
import './translation'
import { animationToDataset, workerPool } from './renderWorker/renderer'
import { AJDialog } from './ui/ajDialog'
import Settings from './ui/animatedJavaSettings.svelte'
import './modelFormat'
import * as ajMainMenu from './ui/ajSettings'

// @ts-ignore
globalThis.ANIMATED_JAVA = {
	animationToDataset,
	workerPool,
	diagTest() {
		const d = new AJDialog({
			svelteComponent: Settings,
			title: 'Animated Java: Dialog Test',
			id: 'animatedJava.test',
		})
		d.show()
		return d
	},
	mainMenu: ajMainMenu.menuBarEntry,
}

// console.log({
// 	instance: new x({
// 		target: document.querySelector('div.start_screen_right')!,
// 		props: {
// 			x: '12345',
// 		},
// 	}),
// 	component: x,
// })

BBPlugin.register(PACKAGE.name, {
	title: PACKAGE.title,
	author: PACKAGE.author.name,
	description: PACKAGE.description,
	icon: 'icon-armor_stand',
	variant: 'desktop',
	// @ts-ignore // Blockbench types are outdated still >:I
	version: PACKAGE.version,
	min_version: PACKAGE.min_blockbench_version,
	tags: ['Minecraft: Java Edition', 'Animation', 'Armor Stand'],
	onload() {
		// devlog(`${PACKAGE.name} loaded!`)
		events.load.trigger()
	},
	onunload() {
		// devlog(`${PACKAGE.name} unloaded!`)
		events.unload.trigger()
	},
	oninstall() {
		// devlog(`${PACKAGE.name} installed!`)
		events.install.trigger()
	},
	onuninstall() {
		// devlog(`${PACKAGE.name} uninstalled!`)
		events.uninstall.trigger()
	},
})

// KEEP CODE WITHIN THESE BOUNDS
svelteHelperMarkPluginInitializationComplete()
svelteHelperLogCollectedNodes()
