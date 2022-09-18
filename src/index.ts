import {
	SvelteHelperLogCollectedNodes,
	SvelteHelperMarkPluginInitialization,
	SvelteHelperMarkPluginInitializationComplete,
} from './svelteFixup'

SvelteHelperMarkPluginInitialization()
//! KEEP CODE WITHIN THESE BOUNDS

import * as PACKAGE from '../package.json'
import { events } from './events'
import './mods'
import x from './ui/test.svelte'

console.log({
	instance: new x({
		target: document.querySelector('#start-files > div.start_screen_right')!,
		props: {
			x: '12345',
		},
	}),
	component: x,
})

BBPlugin.register(PACKAGE.name, {
	title: PACKAGE.title,
	author: PACKAGE.author.name,
	description: PACKAGE.description,
	icon: 'create_session',
	variant: 'desktop',
	// @ts-ignore // Blockbench types are outdated >:I
	version: PACKAGE.version,
	min_version: PACKAGE.min_blockbench_version,
	tags: ['Tag 1', 'Tag 2', 'Tag 3'],
	onload() {
		devlog(`${PACKAGE.name} loaded!`)
		events.load.trigger()
	},
	onunload() {
		devlog(`${PACKAGE.name} unloaded!`)
		events.unload.trigger()
	},
	oninstall() {
		devlog(`${PACKAGE.name} installed!`)
		events.install.trigger()
	},
	onuninstall() {
		devlog(`${PACKAGE.name} uninstalled!`)
		events.uninstall.trigger()
	},
})

//! KEEP CODE WITHIN THESE BOUNDS
SvelteHelperMarkPluginInitializationComplete()
SvelteHelperLogCollectedNodes()
