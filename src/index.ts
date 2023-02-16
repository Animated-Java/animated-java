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
import './translation'
import { animationToDataset, workerPool } from './renderWorker/renderer'
import { AJDialog } from './ui/ajDialog'
import Settings from './ui/animatedJavaSettings.svelte'
import './modelFormat'
import './projectSettings'
import './ui/ajSettings'
import './ui/ajProjectSettings'

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
