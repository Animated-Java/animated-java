import {
	svelteHelperLogCollectedNodes,
	svelteHelperMarkPluginInitialization,
	svelteHelperMarkPluginInitializationComplete,
} from './svelteFixup'

svelteHelperMarkPluginInitialization()
// KEEP CODE WITHIN THESE BOUNDS

import PACKAGE from '../package.json'
import * as events from './util/events'
import './util/mods'
import './util/translation'
import './modelFormat'
import { _AnimatedJavaExporter } from './exporter'
import { translate } from './util/translation'
import * as AJSettings from './settings'
import './minecraftPrism'
import './projectSettings'
import './ui/ajSettings'
import './ui/ajVariantsPanel'
import './ui/ajProjectSettings'
import './ui/ajAnimationConfig'
import './mods/keyframeMod'
import './ui/ajKeyframe'
import './mods/modeMod'
import './mods/textureMod'
import { openAjDocsDialog } from './ui/ajDocs'
import { applyModelVariant } from './variants'
import { renderAllAnimations } from './rendering/renderer'

// @ts-ignore
globalThis.AnimatedJavaExporter = _AnimatedJavaExporter
// @ts-ignore
globalThis.AnimatedJavaSettings = AJSettings
// @ts-ignore
globalThis[PACKAGE.name] = {
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
	renderAllAnimations,
}
// Uninstall events
events.uninstall.subscribe(() => {
	// @ts-ignore
	globalThis[PACKAGE.name] = undefined
	// @ts-ignore
	globalThis.AnimatedJavaExporter = undefined
	// @ts-ignore
	globalThis.AnimatedJavaSettings = undefined
})

import('./exporters/animationExporter')
import('./exporters/statueExporter')
import('./exporters/rawExporter')

// Expose this plugin's events to other plugins
// @ts-ignore
globalThis[PACKAGE.name].events = events

BBPlugin.register(PACKAGE.name, {
	title: PACKAGE.title,
	author: PACKAGE.author.name,
	description: PACKAGE.description,
	icon: 'icon-armor_stand',
	variant: 'desktop',
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
