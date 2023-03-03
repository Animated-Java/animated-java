import { AnimatedJavaExporter } from './exporter'
import { IAnimatedJavaProjectSettings } from './projectSettings'
import { Setting } from './settings'
import { translate } from './util/translation'
import { VariantsContainer } from './variants'

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
		docClick: (link: string) => void
		openAjDocsDialog: (link: string) => void
	}
}
