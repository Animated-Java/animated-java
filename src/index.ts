import {
	svelteHelperLogCollectedNodes,
	svelteHelperMarkPluginInitialization,
	svelteHelperMarkPluginInitializationComplete,
} from './svelteFixup'

svelteHelperMarkPluginInitialization()
// KEEP CODE WITHIN THESE BOUNDS

import PACKAGE from '../package.json'
import { events } from './util/events'
import './util/mods'
import './util/translation'
import { animationToDataset, workerPool } from './renderWorker/renderer'
import './modelFormat'
import { _AnimatedJavaExporter } from './exporter'
import { translate } from './util/translation'
import * as AJSettings from './settings'
import './minecraftPrism'
import './projectSettings'
import './ui/ajSettings'
import './ui/ajProjectSettings'
import './ui/ajAnimationConfig'
import './ui/ajVariantsPanel'
import './mods/keyframeMod'
import './ui/ajKeyframe'
import './mods/modeMod'
import './mods/textureMod'
import { openAjDocsDialog } from './ui/ajDocs'
import { applyModelVariant } from './variants'

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
	applyModelVariant,
}
// Uninstall events
events.uninstall.subscribe(() => {
	// @ts-ignore
	globalThis.ANIMATED_JAVA = undefined
	// @ts-ignore
	globalThis.AnimatedJavaExporter = undefined
	// @ts-ignore
	globalThis.AnimatedJavaSettings = undefined
})

import('./exporters/animationExporter')
import('./exporters/statueExporter')
import('./exporters/rawExporter')

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
		events.load.dispatch()
	},
	onunload() {
		// devlog(`${PACKAGE.name} unloaded!`)
		events.unload.dispatch()
	},
	oninstall() {
		// devlog(`${PACKAGE.name} installed!`)
		events.install.dispatch()
	},
	onuninstall() {
		// devlog(`${PACKAGE.name} uninstalled!`)
		events.uninstall.dispatch()
	},
})

// KEEP CODE WITHIN THESE BOUNDS
svelteHelperMarkPluginInitializationComplete()
svelteHelperLogCollectedNodes()
