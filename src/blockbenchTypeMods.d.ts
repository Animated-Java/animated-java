import type {
	BLUEPRINT_CODEC,
	BLUEPRINT_FORMAT,
	IBlueprintBoneConfigJSON,
	IBlueprintLocatorConfigJSON,
} from './blueprintFormat'
import { blueprintSettingErrors, defaultValues } from './blueprintSettings'
import { openExportProgressDialog } from './interface/dialog/exportProgress'
import { openUnexpectedErrorDialog } from './interface/dialog/unexpectedError'
import { TextDisplay } from './outliner/textDisplay'
import datapackCompiler from './systems/datapackCompiler'
import resourcepackCompiler from './systems/resourcepackCompiler'
import { MINECRAFT_REGISTRY } from './systems/minecraft/registryManager'
import { isDataPackPath, isResourcePackPath } from './util/minecraftUtil'
import { Valuable } from './util/stores'
import { type Variant } from './variants'
import { VanillaItemDisplay } from './outliner/vanillaItemDisplay'
import { VanillaBlockDisplay } from './outliner/vanillaBlockDisplay'
import { EasingKey } from './util/easing'

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

	const AnimatedJava: {
		API: {
			compileDataPack: typeof datapackCompiler
			compileResourcePack: typeof resourcepackCompiler
			Variant: typeof Variant
			MINECRAFT_REGISTRY: typeof MINECRAFT_REGISTRY
			openExportProgressDialog: typeof openExportProgressDialog
			isResourcePackPath: typeof isResourcePackPath
			isDataPackPath: typeof isDataPackPath
			blueprintSettingErrors: typeof blueprintSettingErrors
			openUnexpectedErrorDialog: typeof openUnexpectedErrorDialog
			BLUEPRINT_FORMAT: typeof BLUEPRINT_FORMAT
			BLUEPRINT_CODEC: typeof BLUEPRINT_CODEC
			TextDisplay: typeof TextDisplay
			VanillaItemDisplay: typeof VanillaItemDisplay
			VanillaBlockDisplay: typeof VanillaBlockDisplay
		}
	}
}
