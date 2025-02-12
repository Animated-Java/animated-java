import type {
	IBlueprintBoneConfigJSON,
	IBlueprintLocatorConfigJSON,
} from './blockbench-additions/model-formats/ajblueprint'
import { VanillaBlockDisplay } from './blockbench-additions/outliner-elements/blockDisplay'
import { VanillaItemDisplay } from './blockbench-additions/outliner-elements/itemDisplay'
import { TextDisplay } from './blockbench-additions/outliner-elements/textDisplay'
import { defaultValues } from './blueprintSettings'
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
		animated_java: { [T in keyof typeof defaultValues]: (typeof defaultValues)[T] }
		last_used_export_namespace: string
		visualBoundingBox?: THREE.LineSegments
		pluginMode: Valuable<boolean>
		transparentTexture: Texture

		showingInvalidCubeRotations: boolean

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
		rotationInvalid: boolean
	}

	interface CubeFace {
		lastVariant: Variant | undefined
	}
}
