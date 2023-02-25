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
import './modelFormat'
import './projectSettings'
import './ui/ajSettings'
import './ui/ajProjectSettings'
import './ui/ajDocs'
import { _AnimatedJavaExporter } from './exporter'
import { translate } from './translation'
import { AnimatedJavaSettings } from './settings'
import * as AJSettings from './settings'

// @ts-ignore
globalThis.AnimatedJavaExporter = _AnimatedJavaExporter
// @ts-ignore
globalThis.AnimatedJavaSettings = AJSettings
// @ts-ignore
globalThis.ANIMATED_JAVA = {
	animationToDataset,
	workerPool,
	translate,
	settings: AnimatedJavaSettings,
}

import('./exporters/statueExporter')
import('./exporters/animationExporter')

// setTimeout(() => {
// 	if (!(AnimatedJavaSettings.default_exporter instanceof RecordSetting)) return
// 	AnimatedJavaSettings.default_exporter.options = _AnimatedJavaExporter.getRecordOptions()
// 	AnimatedJavaSettings.default_exporter.push({
// 		value: Object.keys(_AnimatedJavaExporter.getRecordOptions())[0],
// 	})
// }, 100)

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
