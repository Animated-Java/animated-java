import type {
	IBlueprintBoneConfigJSON,
	IBlueprintLocatorConfigJSON,
} from './blueprintFormat'
import { blueprintSettingErrors, defaultValues } from './blueprintSettings'
import { openExportProgressDialog } from './interface/dialog/exportProgress'
import { openUnexpectedErrorDialog } from './interface/dialog/unexpectedError'
import { TextDisplay } from './outliner/textDisplay'
import { VanillaBlockDisplay } from './outliner/vanillaBlockDisplay'
import { VanillaItemDisplay } from './outliner/vanillaItemDisplay'
import datapackCompiler from './systems/datapackCompiler'
import { MINECRAFT_REGISTRY } from './systems/minecraft/registryManager'
import resourcepackCompiler from './systems/resourcepackCompiler'
import { EasingKey } from './util/easing'
import { isDataPackPath, isResourcePackPath } from './util/minecraftUtil'
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
