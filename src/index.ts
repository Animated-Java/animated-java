// These imports are in a specific order. Try not to change them around too much!
// FIXME - Deepslate should only be importing the NBT library.
import * as deepslate from 'deepslate'
import PACKAGE from '../package.json'
import './exporter'
import { AnimatedJavaExporter } from './exporter'
import { generateSearchTree, JsonText } from './minecraft'
import './modelFormat'
import { createChaos } from './mods/cubeMod'
import './mods/cubeMod'
import './mods/cubeFaceMod'
import './mods/animationMod'
import './mods/keyframeMod'
import './mods/modeMod'
import './mods/textureMod'
import './mods/groupMod'
import './mods/boneAnimatorMod'
import './projectSettings'
import * as AJSettings from './settings'
import { createInfo } from './settings'
import './ui/ajAnimationProperties'
import { openAJDocsDialog } from './ui/ajDocs'
import './ui/ajKeyframe'
import './ui/ajMenuBar'
import './ui/ajProjectSettings'
import './ui/ajSettings'
import './ui/ajVariantsPanel'
import './ui/popups/invalidCubes'
import { consoleGroupCollapsed } from './util/console'
import * as events from './events'
import { transposeMatrix, formatStr, roundTo, roundToN } from './util/misc'
import './util/moddingTools'
import { ProgressBarController } from './util/progress'
import './util/translation'
import { addTranslations, translate } from './util/translation'
import * as VirtualFileSystem from './util/virtualFileSystem'

Prism.languages.mcfunction = {}

// @ts-ignore
globalThis.AnimatedJava = {
	// settings: AJSettings.animatedJavaSettings,
	createChaos,
	docClick(link: string) {
		if (link.startsWith('page:')) {
			link = link.substring(5)
			let section: string | undefined
			if (link.includes('#')) [link, section] = link.split('#')
			openAJDocsDialog(link, section)
			return
		} else if (link.startsWith('tag:')) {
			console.log(`Tag links aren't implemented: '${link}'`)
		}
		Blockbench.openLink(link)
	},
	// Expose this plugin's events to other plugins
	events,

	API: {
		Settings: AJSettings,
		Exporter: AnimatedJavaExporter,
		translate,
		addTranslations,
		formatStr,
		roundTo,
		roundToN,
		VirtualFileSystem,
		deepslate,
		ProgressBarController,
		createInfo,
		JsonText,
		columnToRowMajor: transposeMatrix,
		generateSearchTree,
	},
}
// Uninstall events
events.EXTRACT_MODS.subscribe(() => {
	// @ts-ignore
	globalThis.AnimatedJava = undefined
})

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
	onload: consoleGroupCollapsed(`${PACKAGE.name}:onload`, () => {
		events.LOAD.dispatch()
		AnimatedJava.loaded = true
	}),
	onunload: consoleGroupCollapsed(`${PACKAGE.name}:onunload`, () => {
		events.UNLOAD.dispatch()
	}),
	oninstall: consoleGroupCollapsed(`${PACKAGE.name}:oninstall`, () => {
		events.INSTALL.dispatch()
	}),
	onuninstall: consoleGroupCollapsed(`${PACKAGE.name}:onuninstall`, () => {
		events.UNINSTALL.dispatch()
	}),
})

import('../exporters/animationExporter')
import('../exporters/statueExporter')
import('../exporters/rawExporter')
