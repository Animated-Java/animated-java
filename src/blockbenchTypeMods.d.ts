import type {
	BLUEPRINT_CODEC,
	BLUEPRINT_FORMAT,
	IBlueprintBoneConfigJSON,
	IBlueprintLocatorConfigJSON,
} from './blueprintFormat'
import { blueprintSettingErrors } from './blueprintSettings'
import { openExportProgressDialog } from './interface/exportProgressDialog'
import { openUnexpectedErrorDialog } from './interface/unexpectedErrorDialog'
import { TextDisplay } from './outliner/textDisplay'
import { compileDataPack } from './systems/datapackCompiler'
import { compileResourcePack } from './systems/resourcepackCompiler'
import { MINECRAFT_REGISTRY } from './systems/minecraft/registryManager'
import { isDataPackPath, isResourcePackPath } from './util/minecraftUtil'
import { Valuable } from './util/stores'
import { type Variant } from './variants'
import { VanillaItemDisplay } from './outliner/vanillaItemDisplay'
import { VanillaBlockDisplay } from './outliner/vanillaBlockDisplay'

declare module 'three' {
	interface Object3D {
		isVanillaItemModel?: boolean
		isVanillaBlockModel?: boolean
		isTextDisplayText?: boolean
		fix_scale?: THREE.Vector3
	}
}

declare global {
	interface ModelProject {
		animated_java: {
			export_namespace: string
			show_bounding_box: boolean
			auto_bounding_box: boolean
			bounding_box: [number, number]
			// Export Settings
			enable_plugin_mode: boolean
			enable_resource_pack: boolean
			enable_data_pack: boolean
			// Resource Pack Settings
			display_item: string
			customModelDataOffset: number
			enable_advanced_resource_pack_settings: boolean
			resource_pack: string
			display_item_path: string
			model_folder: string
			texture_folder: string
			// Data Pack Settings
			enable_advanced_data_pack_settings: boolean
			data_pack: string
			summon_commands: string
			interpolation_duration: number
			teleportation_duration: number
			use_storage_for_animation: boolean
		}
		last_used_export_namespace: string
		visualBoundingBox?: THREE.LineSegments
		pluginMode: Valuable<boolean>
		transparentTexture: Texture

		variants: Variant[]
		textDisplays: TextDisplay[]
		vanillaItemDisplays: VanillaItemDisplay[]
		vanillaBlockDisplays: VanillaBlockDisplay[]
	}

	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface _Animation {
		excluded_bones: CollectionItem[]
	}

	interface Group {
		configs: {
			default: IBlueprintBoneConfigJSON
			/**
			 * @key Variant UUID
			 * @value Variant Bone Config
			 */
			variants: Record<string, IBlueprintBoneConfigJSON>
		}
	}

	interface Locator {
		config: IBlueprintLocatorConfigJSON
	}

	interface Cube {
		rotationInvalid: boolean
	}

	interface CubeFace {
		lastVariant: Variant | undefined
	}

	const AnimatedJava: {
		API: {
			compileDataPack: typeof compileDataPack
			compileResourcePack: typeof compileResourcePack
			Variant: typeof Variant
			MINECRAFT_REGISTRY: typeof MINECRAFT_REGISTRY
			openExportProgressDialog: typeof openExportProgressDialog
			isResourcePackPath: typeof isResourcePackPath
			isDataPackPath: typeof isDataPackPath
			blueprintSettingErrors: typeof blueprintSettingErrors
			openUnexpectedErrorDialog: typeof openUnexpectedErrorDialog
			TRANSPARENT_TEXTURE: Texture
			BLUEPRINT_FORMAT: typeof BLUEPRINT_FORMAT
			BLUEPRINT_CODEC: typeof BLUEPRINT_CODEC
			TextDisplay: typeof TextDisplay
			VanillaItemDisplay: typeof VanillaItemDisplay
			VanillaBlockDisplay: typeof VanillaBlockDisplay
		}
	}
}
