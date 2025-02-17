import type { PACKAGE } from '@aj/constants'
import type {
	CameraConfig,
	CommonDisplayConfig,
	LocatorConfig,
	Serialized,
	TextDisplayConfig,
} from '@aj/systems/node-configs'

namespace v1_6_4 {
	export type IBlueprintBoneConfigJSON = Serialized<CommonDisplayConfig>
	export type IBlueprintLocatorConfigJSON = Serialized<LocatorConfig>
	export type IBlueprintCameraConfigJSON = Serialized<CameraConfig>
	export type IBlueprintTextDisplayConfigJSON = Serialized<TextDisplayConfig>

	/**
	 * The serialized Variant
	 */
	export interface IBlueprintVariantJSON {
		/**
		 * The display name of the Variant. Only use in Blockbench and for error messages.
		 */
		display_name: string
		/**
		 * The name of the Variant
		 */
		name: string
		/**
		 * The uuid of the Variant
		 */
		uuid: string
		/**
		 * The texture map for the Variant
		 */
		texture_map: Record<string, string>
		/**
		 * The list of bones that should be ignored when applying the Variant
		 */
		excluded_nodes: string[]
		/**
		 * Whether or not this is the default Variant
		 */
		is_default?: true
	}

	/**
	 * The serialized Blueprint
	 */
	export interface IBlueprintFormatJSON {
		meta: {
			format: 'animated_java_blueprint'
			format_version: string
			uuid: string
			last_used_export_namespace: string
			box_uv?: boolean
			backup?: boolean
			save_location?: string
		}
		/**
		 * The project settings of the Blueprint
		 */
		blueprint_settings?: NonNullable<typeof Project>['animated_java']
		/**
		 * The variants of the Blueprint
		 */
		variants: {
			/**
			 * The default Variant of the Blueprint
			 */
			default: IBlueprintVariantJSON
			/**
			 * The list of variants of the Blueprint, excluding the default Variant
			 */
			list: IBlueprintVariantJSON[]
		}

		resolution: {
			width: number
			height: number
		}

		elements: any[]
		outliner: any[]
		textures: Texture[]
		animations: AnimationOptions[]
		animation_controllers?: AnimationControllerOptions[]
		animation_variable_placeholders: string
		backgrounds?: Record<string, any>
	}

	export interface IBlueprintFormat {
		meta: {
			format: `${typeof PACKAGE.name}:utility_model`
			format_version: '0.0.5'
		}
	}
}

export default {
	upgrade(model: any): v1_6_4.IBlueprintFormat {
		console.groupCollapsed('Updating utility model to 1.6.4')

		// As this is the first version the DFU knows of, there is nothing to upgrade.
		// However, we should make sure the format version is correct.
		model.meta.format_version = '1.6.4'

		console.groupEnd()
		return model as v1_6_4.IBlueprintFormat
	},
}
