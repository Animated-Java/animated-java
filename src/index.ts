import { PACKAGE } from './constants'
import { events } from './util/events'
import './util/translation'

// Blueprint Format
import './blueprintFormat'
// Interface
import './interface/animatedJavaBarItem'
import './interface/boneConfigDialog'
import './interface/variantsPanel'
import './interface/importOldAJModelLoader'
import './interface/customKeyframePanel'
// Blockbench Mods
import './mods/modelFormatMod'
import './mods/customKeyframesMod'
import './mods/keyframeMod'
import './mods/animationControllerMod'
import './mods/bonePropertiesMod'
import './mods/exportOverActionMod'
import './mods/groupContextMenuMod'
import './mods/panelMod'
import './mods/projectSettingsActionOverride'
import './mods/saveAllAnimationsActionMod'
import './mods/saveProjectActionMod'
import './mods/saveProjectAsActionMod'
import './mods/variantPreviewCubeFaceMod'
// Compilers
import { compileDataPack } from './systems/datapackCompiler'
// Misc imports
import { Variant } from './variants'
import './util/minecraftRegistries'
import { MINECRAFT_REGISTRY } from './util/minecraftRegistries'
import { compileResourcePack } from './systems/resourcepackCompiler'
import {
	openExportProgressDialog,
	setProgress,
	getProgress,
	logMessage,
} from './interface/exportProgressDialog'

// @ts-ignore
globalThis.AnimatedJava = {
	API: {
		compileDataPack,
		compileResourcePack,
		Variant,
		MINECRAFT_REGISTRY,
		openExportProgressDialog,
		setProgress,
		getProgress,
		logMessage,
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
