import { PACKAGE } from './constants'
import { events } from './util/events'
import './util/translation'

// Blueprint Format
import './blueprintFormat'
// Interface
import './interface/animatedJavaBarItem'
import './interface/boneConfigDialog'
import './interface/variantsPanel'
import './interface/importAJModelLoader'
import './interface/customKeyframePanel'
import './interface/textDisplayElementPanel'
import './interface/textDisplayConfigDialog'
import './interface/vanillaItemDisplayConfigDialog'
import './interface/vanillaItemDisplayElementPanel'
import './interface/vanillaBlockDisplayConfigDialog'
import './interface/vanillaBlockDisplayElementPanel'
import './interface/keyframeEasings'
import './interface/locatorConfigDialog'
// Blockbench Mods
import './mods/animationControllerMod'
import './mods/animationPropertiesAction'
import './mods/animationPropertiesMod'
import './mods/bonePropertiesMod'
import './mods/cubeOutlineMod'
import './mods/customKeyframesMod'
import './mods/exportOverActionMod'
import './mods/groupContextMenuMod'
import './mods/groupNameMod'
import './mods/keyframeMod'
import './mods/locatorAnimatorMod'
import './mods/locatorContextMenuMod'
import './mods/locatorPropertiesMod'
import './mods/modelFormatConvertToMod'
import './mods/modelFormatMod'
import './mods/molangMod'
import './mods/panelMod'
import './mods/previewRaycastMod'
import './mods/projectSettingsActionOverride'
import './mods/saveAllAnimationsActionMod'
import './mods/saveProjectActionMod'
import './mods/saveProjectAsActionMod'
import './mods/variantPreviewCubeFaceMod'
import './mods/showDefaultPoseMod'
import './mods/addLocatorActionMod'
import './mods/blockbenchReadMod'
import './mods/formatIconMod'
// Outliner
import './outliner/textDisplay'
import './outliner/vanillaItemDisplay'
import './outliner/vanillaBlockDisplay'
// Compilers
import { compileDataPack } from './systems/datapackCompiler'
// Minecraft Systems
import './systems/minecraft/versionManager'
import './systems/minecraft/registryManager'
import './systems/minecraft/blockstateManager'
import './systems/minecraft/assetManager'
import './systems/minecraft/fontManager'
// Misc imports
import { TRANSPARENT_TEXTURE, Variant } from './variants'
import './systems/minecraft/registryManager'
import { MINECRAFT_REGISTRY } from './systems/minecraft/registryManager'
import { compileResourcePack } from './systems/resourcepackCompiler'
import { openExportProgressDialog } from './interface/exportProgressDialog'
import { isDataPackPath, isResourcePackPath } from './util/minecraftUtil'
import { blueprintSettingErrors } from './blueprintSettings'
import { openUnexpectedErrorDialog } from './interface/unexpectedErrorDialog'
import { BLUEPRINT_CODEC, BLUEPRINT_FORMAT } from './blueprintFormat'
import { TextDisplay } from './outliner/textDisplay'
import { getLatestVersionClientDownloadUrl } from './systems/minecraft/assetManager'
import {
	hideLoadingPopup,
	showLoadingPopup,
	showOfflineError,
} from './interface/animatedJavaLoadingPopup'
import { getVanillaFont } from './systems/minecraft/fontManager'
import * as assetManager from './systems/minecraft/assetManager'
import * as itemModelManager from './systems/minecraft/itemModelManager'
import * as blockModelManager from './systems/minecraft/blockModelManager'
import { VanillaItemDisplay } from './outliner/vanillaItemDisplay'
import { VanillaBlockDisplay, debugBlockState, debugBlocks } from './outliner/vanillaBlockDisplay'
import { BLOCKSTATE_REGISTRY } from './systems/minecraft/blockstateManager'
import { exportProject } from './systems/exporter'
import { openBlueprintLoadingDialog } from './interface/blueprintLoadingPopup'

// Show loading popup
void showLoadingPopup().then(async () => {
	if (!window.navigator.onLine) {
		showOfflineError()
		// return
	}
	events.NETWORK_CONNECTED.dispatch()

	await Promise.all([
		new Promise<void>(resolve => events.MINECRAFT_ASSETS_LOADED.subscribe(() => resolve())),
		new Promise<void>(resolve => events.MINECRAFT_REGISTRY_LOADED.subscribe(() => resolve())),
		new Promise<void>(resolve => events.MINECRAFT_FONTS_LOADED.subscribe(() => resolve())),
		new Promise<void>(resolve => events.BLOCKSTATE_REGISTRY_LOADED.subscribe(() => resolve())),
	])
		.then(() => {
			hideLoadingPopup()
		})
		.catch(error => {
			console.error(error)
			Blockbench.showToastNotification({
				text: 'Animated Java failed to load! Please restart Blockbench',
				color: 'var(--color-error)',
			})
		})
})

// @ts-ignore
globalThis.AnimatedJava = {
	API: {
		compileDataPack,
		compileResourcePack,
		Variant,
		MINECRAFT_REGISTRY,
		openExportProgressDialog,
		isResourcePackPath,
		isDataPackPath,
		blueprintSettingErrors,
		openUnexpectedErrorDialog,
		TRANSPARENT_TEXTURE,
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
	},
	onuninstall() {
		events.UNINSTALL.dispatch()
	},
})
