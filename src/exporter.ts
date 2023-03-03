import { ajModelFormat } from './modelFormat'
import { IRenderedAnimation } from './rendering/renderer'
import { Setting as AJSetting, animatedJavaSettings } from './settings'
import { GUIStructure } from './ui/ajUIStructure'
import { consoleGroupCollapsed } from './util/console'
import { createAction, createBlockbenchMod } from './util/moddingTools'
import { translate } from './util/translation'

type ProjectSettings = Record<string, AJSetting<any>>

interface IAnimatedJavaExporterOptions<S extends ProjectSettings> {
	id: string
	name: string
	description: string
	getSettings(): S
	settingsStructure: GUIStructure
	export(
		ajSettings: typeof animatedJavaSettings,
		projectSettings: ModelProject['animated_java_settings'],
		exporterSettings: S,
		renderedAnimations: IRenderedAnimation[]
	): Promise<void>
}

export class AnimatedJavaExporter<S extends ProjectSettings = Record<string, AJSetting<any>>> {
	static exporters = new Map<string, AnimatedJavaExporter<any>>()
	id: string
	name: string
	description: string
	getSettings: IAnimatedJavaExporterOptions<S>['getSettings']
	settingsStructure: GUIStructure
	export: IAnimatedJavaExporterOptions<S>['export']
	constructor(options: IAnimatedJavaExporterOptions<S>) {
		this.id = options.id
		this.name = options.name
		this.description = options.description
		this.getSettings = options.getSettings
		this.settingsStructure = options.settingsStructure
		this.export = consoleGroupCollapsed(
			`Exporting with ${this.name} (${this.id})`,
			options.export
		)

		AnimatedJavaExporter.exporters.set(this.id, this)
	}

	static get all() {
		return [...AnimatedJavaExporter.exporters.entries()].map(v => v[1])
	}
}

createBlockbenchMod(
	'animated_java:export_project',
	{},
	() => {
		return createAction('animated_java:export_project', {
			name: translate('animated_java.menubar.items.export_project'),
			icon: 'insert_drive_file',
			category: 'file',
			condition: () => Format === ajModelFormat,
			click: () => {
				//
			},
		})
	},
	context => {
		context.delete()
	}
)
