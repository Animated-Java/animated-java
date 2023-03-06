import { isValidResourcePackPath } from './minecraft/util'
import { VirtualFolder } from './util/virtualFileSystem'
import { IRenderedAnimation, renderAllAnimations } from './rendering/animationRenderer'
import { IRenderedRig, renderRig } from './rendering/modelRenderer'
import { animatedJavaSettings, IInfoPopup, Setting as AJSetting } from './settings'
import { GUIStructure } from './ui/ajUIStructure'
import { openAjFailedProjectExportReadinessDialog } from './ui/popups/failedProjectExportReadiness'
import { consoleGroupCollapsed } from './util/console'
import { NamespacedString } from './util/moddingTools'

type ProjectSettings = Record<NamespacedString, AJSetting<any>>
type NotUndefined<T> = T extends undefined ? never : T

interface IAnimatedJavaExporterOptions<S extends ProjectSettings> {
	id: NamespacedString
	name: string
	description: string
	getSettings(): S
	settingsStructure: GUIStructure
	export(
		ajSettings: typeof animatedJavaSettings,
		projectSettings: NotUndefined<ModelProject['animated_java_settings']>,
		exporterSettings: S,
		renderedAnimations: IRenderedAnimation[],
		rig: IRenderedRig,
		datapack: VirtualFolder
	): Promise<VirtualFolder> | VirtualFolder
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
	if (!Project?.animated_java_settings) return // Project being optional is annoying

	const selectedExporterId = Project?.animated_java_settings?.exporter?.selected
		?.value as NamespacedString

	const exporter = AnimatedJavaExporter.exporters.get(selectedExporterId)
	if (!exporter) throw new Error(`No exporter found with id "${selectedExporterId}"`)

	const ajSettings = animatedJavaSettings
	const projectSettings = Project.animated_java_settings
	const exporterSettings = Project.animated_java_exporter_settings

	const renderedAnimations = await renderAllAnimations()
	const rig = renderRig()

	const namespace = Project.animated_java_settings.project_namespace.value

	const datapack = new VirtualFolder('datapack')
		.chainNewFolder('data')
		.chainNewFile('pack.mcmeta', {
			pack: {
				pack_format: 12, // 12 since 1.19.4
				description: `"${namespace}" A Datapack generated via Animated Java using the ${exporter.name} exporter.`,
			},
		})

	const output = await exporter.export(
		ajSettings,
		projectSettings,
		exporterSettings,
		renderedAnimations,
		rig,
		datapack
	)

	console.log(output)
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
			// FIXME - Needs translation
			issues.push({
				type: 'error',
				title: `Project Setting "${
					setting.displayName as string
				}" has the following errors:`,
				lines: [info.title, ...info.lines],
			})
		}
	}

	// Verify textures
	for (const texture of Project.textures) {
		// Textures should have a save path
		if (!texture.path) {
			// FIXME - Needs translation
			issues.push({
				type: 'error',
				title: 'Texture Save Path Not Set',
				lines: [`Texture "${texture.name}" does not have a save path`],
			})
			continue
		}
		// Textures should be saved in a valid resource pack
		if (!isValidResourcePackPath(texture.path)) {
			// FIXME - Needs translation
			issues.push({
				type: 'error',
				title: 'Invalid Texture Save Path',
				lines: [`Texture "${texture.name}" is saved in an invalid resource pack`],
			})
		}
	}

	// Verify Outliner
	for (const node of Outliner.root as any[]) {
		if (node instanceof Group) continue
		issues.push({
			type: 'error',
			title: 'Invalid Outliner',
			lines: [
				`The root of the Outliner can only contain bones.`,
				`Please remove the ${
					Object.getPrototypeOf(node).constructor.name as string
				} named "${node?.name as string}" or move it into a bone.`,
			],
		})
	}

	if (issues.find(v => v.type === 'error')) {
		openAjFailedProjectExportReadinessDialog(issues)
		throw new Error('Project is not ready for export')
	}
}
