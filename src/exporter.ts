import { isValidResourcePackPath } from './minecraft/util'
import { IRenderedAnimation, renderAllAnimations } from './rendering/animationRenderer'
import { animatedJavaSettings, IInfoPopup, Setting as AJSetting } from './settings'
import { GUIStructure } from './ui/ajUIStructure'
import { openAjFailedProjectExportReadinessDialog } from './ui/popups/failedProjectExportReadiness'
import { consoleGroupCollapsed } from './util/console'
import { NamespacedString } from './util/moddingTools'

type ProjectSettings = Record<NamespacedString, AJSetting<any>>

interface IAnimatedJavaExporterOptions<S extends ProjectSettings> {
	id: NamespacedString
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

export class AnimatedJavaExporter<
	S extends ProjectSettings = Record<NamespacedString, AJSetting<any>>
> {
	static exporters = new Map<NamespacedString, AnimatedJavaExporter<any>>()
	id: NamespacedString
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
			`Exporting Animated Java Rig via ${this.name} (${this.id})`,
			options.export
		)

		AnimatedJavaExporter.exporters.set(this.id, this)
	}

	static get all() {
		return [...AnimatedJavaExporter.exporters.entries()].map(v => v[1])
	}
}

export const exportProject = consoleGroupCollapsed('exportProject', async () => {
	verifyProjectExportReadiness()
	if (!Project) return // Project being optional is annoying

	const selectedExporterId = Project?.animated_java_settings?.exporter?.selected
		?.value as NamespacedString

	const exporter = AnimatedJavaExporter.exporters.get(selectedExporterId)
	if (!exporter) throw new Error(`No exporter found with id "${selectedExporterId}"`)

	const ajSettings = animatedJavaSettings
	const projectSettings = Project.animated_java_settings
	const exporterSettings = Project.animated_java_exporter_settings

	const renderedAnimations = await renderAllAnimations()

	await exporter.export(ajSettings, projectSettings, exporterSettings, renderedAnimations)
})

// FIXME - Need GUI for warnings
export function verifyProjectExportReadiness() {
	const issues: IInfoPopup[] = []

	if (!Project) {
		issues.push({
			type: 'error',
			title: 'No Project Found',
			lines: [
				'No project was loaded when the export button was pressed.',
				'Please load a project and try again.',
			],
		})
		return
	}

	if (!Project.animated_java_settings) {
		issues.push({
			type: 'error',
			title: 'No Animated Java Settings Found',
			lines: ['No Animated Java settings found for this project'],
		})
		return
	}

	for (const setting of Object.values(Project.animated_java_settings)) {
		const info = setting.verify() as IInfoPopup | undefined
		if (info?.type === 'error') {
			issues.push({
				type: 'error',
				title: `Project Setting "${
					setting.displayName as string
				}" has the following errors:`,
				lines: [info.title, ...info.lines],
			})
		}
	}

	// // The Rig Export Folder should be set
	// if (Project.animated_java_settings.rig_export_folder.value) {
	// 	// The Rig Export Folder should be located in a valid resource pack
	// 	if (!isValidResourcePackPath(Project.animated_java_settings.rig_export_folder.value))
	// 		throw new Error('Rig Export Folder is not located in a valid resource pack')
	// } else throw new Error('Rig Export Folder is not set')
	// // The Rig Item Model should be set
	// if (Project.animated_java_settings.rig_item_model.value) {
	// 	// The Rig Item Model should be located in a valid resource pack
	// 	if (!isValidResourcePackPath(Project.animated_java_settings.rig_item_model.value))
	// 		throw new Error('Rig Item Model is not located in a valid resource pack')
	// } else throw new Error('Rig Item Model is not set')

	// if (!Project.animated_java_variants) throw new Error('No variants found')

	// Verify textures
	for (const texture of Project.textures) {
		// Textures should have a save path
		if (!texture.path)
			throw {
				type: 'error',
				title: 'Texture Save Path Not Set',
				lines: [`Texture "${texture.name}" does not have a save path`],
			}
		// Textures should be saved in a valid resource pack
		if (!isValidResourcePackPath(texture.path))
			throw {
				type: 'error',
				title: 'Invalid Texture Save Path',
				lines: [`Texture "${texture.name}" is saved in an invalid resource pack`],
			}
	}

	if (issues.find(v => v.type === 'error')) {
		openAjFailedProjectExportReadinessDialog(issues)
		throw new Error('Project is not ready for export')
	}
}
