import type { AnimatedJavaExporter } from './exporter'
import type { generateSearchTree, JsonText } from './minecraft'
import type { IAnimatedJavaProjectSettings } from './projectSettings'
import type { createInfo, Setting } from './settings'
import type { addTranslations, translate } from './util/translation'
import type { formatStr, roundTo, roundToN } from './util/misc'
import type { ProgressBarController } from './util/progress'
import type { VariantsContainer } from './variants'
import { Writable } from 'svelte/store'

declare global {
	type NotUndefined<T> = T extends undefined ? never : T

	interface IDocsManifest {
		structure: Record<string, any>
		pages: IDocsManifestPage[]
	}
	interface IDocsManifestPage {
		title: string
		url: string
		children?: string[]
		content: string
	}

	const AnimatedJava: {
		loaded?: boolean
		docClick: (link: string) => void
		events: typeof import('./events')
		progress: Writable<number>
		progress_text: Writable<string>

		API: {
			Exporter: typeof AnimatedJavaExporter
			Settings: typeof import('./settings')
			translate: typeof translate
			addTranslations: typeof addTranslations
			formatStr: typeof formatStr
			roundTo: typeof roundTo
			roundToN: typeof roundToN
			VirtualFileSystem: typeof import('./util/virtualFileSystem')
			deepslate: typeof import('deepslate')
			ProgressBarController: typeof ProgressBarController
			createInfo: typeof createInfo
			JsonText: typeof JsonText
			generateSearchTree: typeof generateSearchTree
			minecraft: typeof import('./minecraft')
		}
	}

	//-------------------------------
	// Blockbench Type modifications
	//-------------------------------

	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface _Animation {
		affected_bones: Array<{ name: string; value: string }>
		affected_bones_is_a_whitelist: boolean
	}

	interface AnimationOptions {
		affected_bones?: Array<{ name: string; value: string }>
		affected_bones_is_a_whitelist?: boolean
	}

	interface AnimationUndoCopy {
		affected_bones: Array<{ name: string; value: string }>
		affected_bones_is_a_whitelist: boolean
	}

	interface Cube {
		forceVisible?: boolean
	}

	interface Group {
		nbt?: string
	}

	interface Locator {
		entity_type: string
		nbt: string
	}

	interface ModelProject {
		animated_java_settings?: IAnimatedJavaProjectSettings
		animated_java_exporter_settings?: Record<string, Record<string, Setting<any>>>
		animated_java_variants?: VariantsContainer
		animated_java_uuid?: string
	}
}
