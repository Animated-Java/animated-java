import type {
	IBlueprintVariantBoneConfigJSON,
	IBlueprintVariantLocatorConfigJSON,
} from './blueprintFormat'
import { Valuable } from './util/stores'
import { type Variant } from './variants'

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
	}

	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface _Animation {
		excluded_bones: CollectionItem[]
	}

	interface Group {
		configs: {
			default: IBlueprintVariantBoneConfigJSON
			variants: Record<string, IBlueprintVariantBoneConfigJSON>
		}
	}

	interface Locator {
		config: IBlueprintVariantLocatorConfigJSON
	}

	interface Cube {
		rotationInvalid: boolean
	}

	interface CubeFace {
		lastVariant: Variant | undefined
	}
}
