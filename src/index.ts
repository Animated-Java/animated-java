// These imports are in a specific order. Try not to change them around too much!
import PACKAGE from '../package.json'
import * as events from './util/events'
import './util/moddingTools'
import './util/translation'
import './modelFormat'
import './exporter'
import { AnimatedJavaExporter, verifyProjectExportReadiness } from './exporter'
import { translate } from './util/translation'
import * as AJSettings from './settings'
import './ui/ajSettings'
import './projectSettings'
import './ui/ajVariantsPanel'
import './ui/ajProjectSettings'
import './ui/ajAnimationConfig'
import './ui/popups/invalidCubes'
import './mods/keyframeMod'
import './ui/ajKeyframe'
import './mods/modeMod'
import './mods/textureMod'
import './mods/cubeMod'
import { renderRig } from './rendering/modelRenderer'
import { openAjDocsDialog } from './ui/ajDocs'
import { applyModelVariant } from './variants'
import { renderAllAnimations } from './rendering/animationRenderer'
import { consoleGroupCollapsed } from './util/console'
import { createChaos } from './mods/cubeMod'
import './ui/ajMenuBar'
import { formatStr } from './util/misc'
import * as deepslate from 'deepslate'
import * as VirtualFileSystem from './util/virtualFileSystem'
import { ProgressBarController } from './util/progress'
import { createInfo } from './settings'
import { JsonText } from './minecraft'

Prism.languages.mcfunction = {}

// @ts-ignore
globalThis.AnimatedJava = {
	translate,
	settings: AJSettings.animatedJavaSettings,
	Settings: AJSettings,
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
	Exporter: AnimatedJavaExporter,
	// Expose this plugin's events to other plugins
	events,
	createChaos,
	renderRig,
	verifyProjectExportReadiness,
	formatStr,
	VirtualFileSystem,
	deepslate,
	ProgressBarController,
	createInfo,
	JsonText,
}
// Uninstall events
events.EXTRACT_MODS.subscribe(() => {
	// @ts-ignore
	globalThis[PACKAGE.name] = undefined
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
	version: PACKAGE.version,
	min_version: PACKAGE.min_blockbench_version,
	tags: ['Minecraft: Java Edition', 'Animation', 'Armor Stand'],
	await_loading: true,
	onload: consoleGroupCollapsed(`${PACKAGE.name}:onload`, () => {
		events.LOAD.dispatch()
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
