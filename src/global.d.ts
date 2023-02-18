import { _AnimatedJavaExporter } from './exporter'
import { IAnimatedJavaProjectSettings } from './projectSettings'
import { translate } from './translation'

declare global {
	interface ModelProject {
		animated_java_settings?: IAnimatedJavaProjectSettings
	}
	const AnimatedJavaExporter: typeof _AnimatedJavaExporter
	const AnimatedJavaSettings: typeof import('./settings')
	const ANIMATED_JAVA: {
		translate: typeof translate
	}
}
