import type { AnimatedJavaExporter } from './exporter'
import type { IAnimatedJavaProjectSettings } from './projectSettings'
import type { Setting, createInfo } from './settings'
import type { translate } from './util/translation'
import type { VariantsContainer } from './variants'

type ProjectSettings = Record<string, Setting<any>>

declare global {
	interface Cube {
		forceVisible?: boolean
		_forceVisible?: boolean
	}

	interface ModelProject {
		animated_java_settings?: IAnimatedJavaProjectSettings
		animated_java_exporter_settings?: Record<string, ProjectSettings>
		animated_java_variants?: VariantsContainer
	}
	const AnimatedJava: {
		Exporter: typeof AnimatedJavaExporter
		settings: Record<string, Setting<unknown>>
		Settings: typeof import('./settings')
		events: typeof import('./util/events')
		translate: typeof translate
		formatStr: typeof import('./util/misc').formatStr
		docClick: (link: string) => void
		openAjDocsDialog: (link: string) => void
		VirtualFileSystem: typeof import('./util/virtualFileSystem')
		deepslate: typeof import('deepslate')
		ProgressBarController: typeof import('./util/progress').ProgressBarController
		createInfo: typeof createInfo
		JsonText: typeof import('./minecraft').JsonText
	}
}
