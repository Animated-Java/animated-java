import { BlueprintSettings } from './blueprintSettings'
import type {
	IBlueprintBoneConfigJSON,
	IBlueprintLocatorConfigJSON,
} from './formats/blueprint/format'
import { TextDisplay } from './outliner/textDisplay'
import { VanillaBlockDisplay } from './outliner/vanillaBlockDisplay'
import { VanillaItemDisplay } from './outliner/vanillaItemDisplay'
import { EasingKey } from './util/easing'
import { Valuable } from './util/stores'
import { type Variant } from './variants'

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
		animated_java: BlueprintSettings
		last_used_export_namespace: string
		visualBoundingBox?: THREE.LineSegments
		pluginMode: Valuable<boolean>
		transparentTexture: Texture

		variants: Variant[]
		textDisplays: TextDisplay[]
		vanillaItemDisplays: VanillaItemDisplay[]
		vanillaBlockDisplays: VanillaBlockDisplay[]

		loadingPromises?: Array<Promise<unknown>>
	}

	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface _Animation {
		excluded_nodes: CollectionItem[]
	}

	interface AnimationUndoCopy {
		excluded_nodes: string[]
	}

	interface AnimationOptions {
		excluded_nodes: string[]
	}

	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface _Keyframe {
		easing?: EasingKey
		easingArgs?: number[]
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
		isRotationValid: boolean
	}

	interface CubeFace {
		lastVariant: Variant | undefined
	}
}
