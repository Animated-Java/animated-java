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
import { _AnimatedJavaExporter } from './exporter'
import { translate } from './translation'
import * as AJSettings from './settings'
import './projectSettings'
import './ui/ajSettings'
import './ui/ajProjectSettings'
import './ui/animationConfig'
import './ui/ajVariants'
import { openAjDocsDialog } from './ui/ajDocs'

// @ts-ignore
globalThis.AnimatedJavaExporter = _AnimatedJavaExporter
// @ts-ignore
globalThis.AnimatedJavaSettings = AJSettings
// @ts-ignore
globalThis.ANIMATED_JAVA = {
	animationToDataset,
	workerPool,
	translate,
	settings: AJSettings.AnimatedJavaSettings,
	openAjDocsDialog,
	docClick(link: string) {
		if (link.startsWith('page:')) {
			link = link.substring(5)
			let section: string | undefined
			if (link.includes('#')) [link, section] = link.split('#')
			openAjDocsDialog(link, section)
			return
		} else if (link.startsWith('tag:')) {
			console.log(`Tag links aren't implemented: '${link}'`)
		}
		Blockbench.openLink(link)
	},
}

import('./exporters/statueExporter')
import('./exporters/animationExporter')

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
	await_loading: true,
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
