import { PACKAGE } from './constants'
import './util/translation'
// Blueprint Format
import './blockbench-additions/model-formats/ajblueprint'
// Interface
import './ui'
// Blockbench Mods
import './blockbench-mods'
// Blockbench Additions
import './blockbench-additions'
// Compilers
import datapackCompiler from './systems/datapack-compiler'
// Minecraft Systems
import './systems/minecraft-temp/assetManager'
import './systems/minecraft-temp/blockstateManager'
import './systems/minecraft-temp/fontManager'
import './systems/minecraft-temp/registryManager'
import './systems/minecraft-temp/versionManager'
// Misc imports
import { BLUEPRINT_CODEC, BLUEPRINT_FORMAT } from './blockbench-additions/model-formats/ajblueprint'
import {
	BlockDisplay,
	debugBlockState,
	debugBlocks,
} from './blockbench-additions/outliner-elements/blockDisplay'
import { TextDisplay } from './blockbench-additions/outliner-elements/textDisplay'
import { blueprintSettingErrors } from './blueprintSettings'
import { cleanupExportedFiles } from './systems/cleaner'
import mcbFiles from './systems/datapack-compiler/versions'
import { exportProject } from './systems/exporter'
import * as assetManager from './systems/minecraft-temp/assetManager'
import { getLatestVersionClientDownloadUrl } from './systems/minecraft-temp/assetManager'
import * as blockModelManager from './systems/minecraft-temp/blockModelManager'
import { BLOCKSTATE_REGISTRY } from './systems/minecraft-temp/blockstateManager'
import { getVanillaFont } from './systems/minecraft-temp/fontManager'
import * as itemModelManager from './systems/minecraft-temp/itemModelManager'
import './systems/minecraft-temp/registryManager'
import { MINECRAFT_REGISTRY } from './systems/minecraft-temp/registryManager'
import resourcepackCompiler from './systems/resourcepack-compiler'
import { openChangelogDialog } from './ui/dialogs/changelog'
import { openExportProgressDialog } from './ui/dialogs/export-progress'
import { openUnexpectedErrorDialog } from './ui/dialogs/unexpected-error'
import { checkForIncompatabilities } from './ui/popups/incompatability'
import { openInstallPopup } from './ui/popups/installed'
import {
	isDataPackPath,
	isResourcePackPath,
	parseResourceLocation,
	parseResourcePackPath,
} from './util/minecraftUtil'
import { Variant } from './variants'

import { ItemDisplay } from './blockbench-additions/outliner-elements/itemDisplay'
import registerPlugin from './plugin'
import { createBlockbenchMod } from './util/moddingTools'

const PLUGIN_API = {
	API: {
		parseResourcePackPath,
		parseResourceLocation,
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
		ItemDisplay,
		BlockDisplay,
		debugBlocks,
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
	},
}

declare global {
	// eslint-disable-next-line @typescript-eslint/naming-convention, no-var
	var AnimatedJava: typeof PLUGIN_API
}

createBlockbenchMod(
	`${PACKAGE.name}:global/api`,
	undefined,
	() => {
		globalThis.AnimatedJava = PLUGIN_API
	},
	() => {
		// @ts-expect-error: AnimatedJava type is not optional, but we want to delete it when uninstalling
		delete globalThis.AnimatedJava
	}
)

requestAnimationFrame(() => {
	if (checkForIncompatabilities()) return

	const lastVersion = localStorage.getItem('animated-java-last-version')
	if (lastVersion !== PACKAGE.version) {
		localStorage.setItem('animated-java-last-version', PACKAGE.version)
		openChangelogDialog()
	}
})

registerPlugin()
