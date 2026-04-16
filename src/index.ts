import { PACKAGE } from './constants'
import EVENTS from './util/events'
import './util/translation'
// Blueprint Format
import 'import_folder_recursive:./formats'
// Interface
import 'import_folder_recursive:./dialogs'
import 'import_folder_recursive:./interface'
import 'import_folder_recursive:./panels'
import 'import_folder_recursive:./popups'
// Blockbench Mods
import 'import_folder_recursive:./mods'
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
import { openChangelogDialog } from './dialogs/changelog/changelog'
import { openExportProgressDialog } from './dialogs/exportProgress/exportProgress'
import { openUnexpectedErrorDialog } from './dialogs/unexpectedError/unexpectedError'
import { BLUEPRINT_FORMAT } from './formats/blueprint'
import { BLUEPRINT_CODEC } from './formats/blueprint/codec'
import { blueprintSettingErrors } from './formats/blueprint/settings'
import { TextDisplay } from './outliner/textDisplay'
import { VanillaBlockDisplay, debugBlockState } from './outliner/vanillaBlockDisplay'
import { VanillaItemDisplay } from './outliner/vanillaItemDisplay'
import { checkForIncompatabilities } from './popups/incompatability/incompatability'
import { openInstallPopup } from './popups/installed/installed'
import { cleanupExportedFiles } from './systems/cleaner'
import mcbFiles from './systems/datapackCompiler/mcbFiles'
import TELLRAW from './systems/datapackCompiler/tellraw'
import { exportProject } from './systems/exporter'
import { JsonText } from './systems/jsonText'
import * as assetManager from './systems/minecraft/assetManager'
import * as blockModelManager from './systems/minecraft/blockModelManager'
import { BLOCKSTATE_REGISTRY, getBlockState } from './systems/minecraft/blockstateManager'
import { MinecraftFont } from './systems/minecraft/fontManager'
import * as itemModelManager from './systems/minecraft/itemModelManager'
import './systems/minecraft/registryManager'
import resourcepackCompiler from './systems/resourcepackCompiler'
import {
	isDataPackPath,
	isResourcePackPath,
	parseResourcePackPath,
	toSmallCaps,
} from './util/minecraftUtil'
import { Variant } from './variants'

declare global {
	interface Window {
		AnimatedJava: typeof AnimatedJavaApi
	}
	// eslint-disable-next-line @typescript-eslint/naming-convention
	const AnimatedJava: typeof AnimatedJavaApi
}
// eslint-disable-next-line @typescript-eslint/naming-convention
const AnimatedJavaApi = {
	parseResourcePackPath,
	datapackCompiler,
	resourcepackCompiler,
	Variant,
	openExportProgressDialog,
	isResourcePackPath,
	isDataPackPath,
	blueprintSettingErrors,
	openUnexpectedErrorDialog,
	BLUEPRINT_FORMAT,
	BLUEPRINT_CODEC,
	TextDisplay,
	MinecraftFont,
	assetManager,
	itemModelManager,
	blockModelManager,
	VanillaItemDisplay,
	VanillaBlockDisplay,
	debugBlockState,
	BLOCKSTATE_REGISTRY,
	exportProject,
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
	printMinecraftFontSheet: async () => {
		if (!Project?.animated_java?.target_minecraft_version) {
			throw new Error('No target Minecraft version set for project!')
		}
		const fontJson = await assetManager.getJSONAsset(
			Project.animated_java.target_minecraft_version,
			'assets/minecraft/font/include/default.json'
		)
		return fontJson.providers[0].chars.map(
			(characters: string, i: number) => `${i}: ` + characters.split('').join(' ')
		)
	},
	TELLRAW,
	JsonText,
	getBlockState,
}
window.AnimatedJava = AnimatedJavaApi

// Uninstall events
EVENTS.EXTRACT_MODS.subscribe(() => {
	// @ts-expect-error Cannot delete type that isn't optional
	delete window.AnimatedJava
})

EVENTS.PLUGIN_FINISHED_LOADING.subscribe(() => {
	if (checkForIncompatabilities()) return

	const lastVersion = localStorage.getItem('animated-java-last-version')
	if (lastVersion !== PACKAGE.version) {
		localStorage.setItem('animated-java-last-version', PACKAGE.version)
		openChangelogDialog()
	}
})

import './plugin'
