import { PACKAGE } from './constants'
import { events } from './util/events'
import './util/translation'
// Blueprint Format
import './blueprintFormat'
// Interface
import './interface'
// Blockbench Mods
import './mods'
// Outliner
import './outliner/textDisplay'
import './outliner/vanillaBlockDisplay'
import './outliner/vanillaItemDisplay'
// Compilers
import datapackCompiler from './systems/datapackCompiler'
// Minecraft Systems
import './systems/minecraft/assetManager'
import './systems/minecraft/blockstateManager'
import './systems/minecraft/fontManager'
import './systems/minecraft/registryManager'
import './systems/minecraft/versionManager'
// Misc imports
import { BLUEPRINT_CODEC, BLUEPRINT_FORMAT } from './blueprintFormat'
import { blueprintSettingErrors } from './blueprintSettings'
import { openChangelogDialog } from './interface/changelogDialog'
import { openExportProgressDialog } from './interface/dialog/exportProgress'
import { openUnexpectedErrorDialog } from './interface/dialog/unexpectedError'
import { openBlueprintLoadingDialog } from './interface/popup/blueprintLoading'
import { checkForIncompatabilities } from './interface/popup/incompatabilityPopup'
import { openInstallPopup } from './interface/popup/installed'
import { TextDisplay } from './outliner/textDisplay'
import { VanillaBlockDisplay, debugBlockState, debugBlocks } from './outliner/vanillaBlockDisplay'
import { VanillaItemDisplay } from './outliner/vanillaItemDisplay'
import { cleanupExportedFiles } from './systems/cleaner'
import mcbFiles from './systems/datapackCompiler/mcbFiles'
import { exportProject } from './systems/exporter'
import * as assetManager from './systems/minecraft/assetManager'
import { getLatestVersionClientDownloadUrl } from './systems/minecraft/assetManager'
import * as blockModelManager from './systems/minecraft/blockModelManager'
import { BLOCKSTATE_REGISTRY } from './systems/minecraft/blockstateManager'
import { getVanillaFont } from './systems/minecraft/fontManager'
import * as itemModelManager from './systems/minecraft/itemModelManager'
import './systems/minecraft/registryManager'
import { MINECRAFT_REGISTRY } from './systems/minecraft/registryManager'
import resourcepackCompiler from './systems/resourcepackCompiler'
import {
	isDataPackPath,
	isResourcePackPath,
	parseResourcePackPath,
	toSmallCaps,
} from './util/minecraftUtil'
import { Variant } from './variants'

// @ts-ignore
globalThis.AnimatedJava = {
	API: {
		parseResourcePackPath,
		datapackCompiler,
		resourcepackCompiler,
		Variant,
		MINECRAFT_REGISTRY,
		openExportProgressDialog,
		isResourcePackPath,
		isDataPackPath,
		blueprintSettingErrors,
		openUnexpectedErrorDialog,
		BLUEPRINT_FORMAT,
		BLUEPRINT_CODEC,
		TextDisplay,
		getLatestVersionClientDownloadUrl,
		getVanillaFont,
		assetManager,
		itemModelManager,
		blockModelManager,
		VanillaItemDisplay,
		VanillaBlockDisplay,
		debugBlocks,
		debugBlockState,
		BLOCKSTATE_REGISTRY,
		exportProject,
		openBlueprintLoadingDialog,
		openInstallPopup,
		removeCubesAssociatedWithTexture(texture: Texture) {
			const cubes = Cube.all.filter(cube =>
				Object.values(cube.faces).some(face => face.texture === texture.uuid)
			)
			Undo.initEdit({ elements: cubes, outliner: true, textures: [texture] })
			cubes.forEach(cube => cube.remove())
			texture.remove()
			Undo.finishEdit('Remove Cubes Associated With Texture')
		},
		cleanupExportedFiles,
		mcbFiles,
		openChangelogDialog,
		checkForIncompatabilities,
		toSmallCharacters: toSmallCaps,
	},
}

requestAnimationFrame(() => {
	if (checkForIncompatabilities()) return

	const lastVersion = localStorage.getItem('animated-java-last-version')
	if (lastVersion !== PACKAGE.version) {
		localStorage.setItem('animated-java-last-version', PACKAGE.version)
		openChangelogDialog()
	}
})

// Uninstall events
events.EXTRACT_MODS.subscribe(() => {
	// @ts-ignore
	globalThis.AnimatedJava = undefined
})

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
		events.LOAD.dispatch()
	},
	onunload() {
		events.UNLOAD.dispatch()
	},
	oninstall() {
		events.INSTALL.dispatch()
		openInstallPopup()
	},
	onuninstall() {
		events.UNINSTALL.dispatch()
		Blockbench.showMessageBox({
			title: 'Animated Java has Been Uninstalled!',
			message: 'In order to fully uninstall Animated Java, please restart Blockbench.',
			buttons: ['OK'],
		})
	},
})
