import { _AnimatedJavaExporter } from './exporter'
import { IAnimatedJavaProjectSettings } from './projectSettings'
import { translate } from './translation'
import { Setting } from './settings'

type ProjectSettings = Record<string, Setting<any>>

declare global {
	interface ModelProject {
		animated_java_settings?: IAnimatedJavaProjectSettings
		animated_java_exporter_settings?: Record<string, ProjectSettings>
	}
	const AnimatedJavaExporter: typeof _AnimatedJavaExporter
	const AnimatedJavaSettings: typeof import('./settings')
	const ANIMATED_JAVA: {
		translate: typeof translate
	}
}
