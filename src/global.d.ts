import { SvelteComponentTyped } from 'svelte'
import { _AnimatedJavaExporter } from './exporter'
import { IAnimatedJavaProjectSettings } from './projectSettings'
import { Setting } from './settings'
import { translate } from './util/translation'
import { VariantsContainer } from './variants'

type ProjectSettings = Record<string, Setting<any>>

declare global {
	interface ModelProject {
		animated_java_settings?: IAnimatedJavaProjectSettings
		animated_java_exporter_settings?: Record<string, ProjectSettings>
		animated_java_variants?: VariantsContainer
	}
	const AnimatedJavaExporter: typeof _AnimatedJavaExporter
	const AnimatedJavaSettings: typeof import('./settings')
	const ANIMATED_JAVA: {
		translate: typeof translate
		docClick: (link: string) => void
		openAjDocsDialog: (link: string) => void
	}
}
