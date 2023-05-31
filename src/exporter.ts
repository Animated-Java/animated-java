import * as events from './events'
import { exportResources } from './resourcePackExporter'
import { GUIStructure } from './guiStructure'
import { projectSettingStructure } from './projectSettings'
import { IRenderedAnimation, renderAllAnimations } from './rendering/animationRenderer'
import { IRenderedRig, renderRig } from './rendering/modelRenderer'
import { animatedJavaSettings, IInfoPopup, Setting as AJSetting, Setting } from './settings'
import { openAJExportInProgressDialog } from './ui/ajExportInProgress'
import { openAjFailedProjectExportReadinessDialog } from './ui/popups/failedProjectExportReadiness'
import { openUnexpectedErrorDialog } from './ui/popups/unexpectedError'
import { consoleGroupCollapsed } from './util/console'
import { ExpectedError } from './util/misc'
import { NamespacedString } from './util/moddingTools'
import { translate } from './util/translation'

type ProjectSettings = Record<NamespacedString, AJSetting<any>>

export interface IAnimatedJavaExportData<S> {
	ajSettings: typeof animatedJavaSettings
	projectSettings: ProjectSettings
	exporterSettings: S
	renderedAnimations: IRenderedAnimation[]
	rig: IRenderedRig
}

interface IAnimatedJavaExporterOptions<S extends ProjectSettings> {
	id: NamespacedString
	name: string
	description: string
	getSettings(): S
	settingsStructure: GUIStructure
	onStartup?: () => void
	export(exportData: IAnimatedJavaExportData<S>): Promise<void> | void
}

export class AnimatedJavaExporter<
	S extends ProjectSettings = Record<NamespacedString, AJSetting<any>>
> {
	static exporters: Record<NamespacedString, AnimatedJavaExporter<any>> = {}
	id: NamespacedString
	name: string
	description: string
	getSettings: IAnimatedJavaExporterOptions<S>['getSettings']
	settingsStructure: GUIStructure
	onStartup?: IAnimatedJavaExporterOptions<S>['onStartup']
	export: IAnimatedJavaExporterOptions<S>['export']
	constructor(options: IAnimatedJavaExporterOptions<S>) {
		this.id = options.id
		this.name = options.name
		this.description = options.description
		this.getSettings = options.getSettings
		this.settingsStructure = options.settingsStructure
		this.onStartup = options.onStartup
		this.export = consoleGroupCollapsed(
			`Exporting Animated Java Rig via ${this.name} (${this.id})`,
			options.export
		)

		events.LOAD_PROJECT.subscribe(() => {
			if (this.onStartup) this.onStartup()
		}, true)

		AnimatedJavaExporter.exporters[this.id] = this
	}

	static get all() {
		return Object.values(AnimatedJavaExporter.exporters)
	}
}

let activelyExporting = false
export async function safeExportProject() {
	if (activelyExporting) return
	activelyExporting = true
	const dialog = openAJExportInProgressDialog()
	await exportProject().catch(e => {
		Blockbench.setProgress(0)
		Blockbench.setStatusBarText('')
		console.error(e)
		dialog.cancel()
		if (e instanceof ExpectedError) return
		openUnexpectedErrorDialog(e)
	})
	activelyExporting = false
	dialog.cancel()
}

export const exportProject = consoleGroupCollapsed('exportProject', async () => {
	verifyProjectExportReadiness()
	if (!Project?.animated_java_settings) return // Project being optional is annoying

	// Pre-export
	const selectedVariant = Project.animated_java_variants!.selectedVariant!
	Project.animated_java_variants?.select()

	const selectedExporterId = Project?.animated_java_settings?.exporter?.selected
		?.value as NamespacedString

	const exporter = AnimatedJavaExporter.exporters[selectedExporterId]
	if (!exporter) throw new Error(`No exporter found with id "${selectedExporterId}"`)

	const ajSettings = animatedJavaSettings
	const projectSettings = Project.animated_java_settings
	const exporterSettings = Project.animated_java_exporter_settings![selectedExporterId]

	const rigItemId = Project.animated_java_settings.rig_item.value

	let textureExportFolder: string, rigExportFolder: string, rigItemModelExportPath: string
	const advancedResourcePackSettingsEnabled =
		Project.animated_java_settings.enable_advanced_resource_pack_settings.value
	if (advancedResourcePackSettingsEnabled) {
		// Advanced Resource Pack settings
		textureExportFolder = Project.animated_java_settings.texture_export_folder.value
		rigExportFolder = Project.animated_java_settings.rig_export_folder.value
		rigItemModelExportPath = Project.animated_java_settings.rig_item_model.value
		console.log('Using advanced resource pack settings')
	} else {
		// Automatic Resource Pack settings
		const resourcePackFolder = PathModule.parse(
			Project.animated_java_settings.resource_pack_mcmeta.value
		).dir
		const projectNamespace = Project.animated_java_settings.project_namespace.value
		textureExportFolder = PathModule.join(
			resourcePackFolder,
			`assets/animated_java/textures/item/${projectNamespace}/`
		)
		rigExportFolder = PathModule.join(
			resourcePackFolder,
			`assets/animated_java/models/item/${projectNamespace}/`
		)
		rigItemModelExportPath = PathModule.join(
			resourcePackFolder,
			`assets/animated_java/models/item/${projectNamespace}/${rigItemId.split(':')[1]}.json`
		)
		console.log('Using automatic resource pack settings')
	}

	const rig = renderRig(rigExportFolder, textureExportFolder)
	const renderedAnimations = await renderAllAnimations(rig)

	await exportResources(
		ajSettings,
		projectSettings,
		rig,
		rigExportFolder,
		textureExportFolder,
		rigItemModelExportPath
	)
	// Resources MUST be exported before the exporter is ran
	await exporter.export({
		ajSettings,
		projectSettings: projectSettings as any,
		exporterSettings,
		renderedAnimations,
		rig,
	})

	Blockbench.showQuickMessage(translate('animated_java.quickmessage.exported_successfully'), 2000)
	// Post-export
	Project.animated_java_variants?.select(selectedVariant)
})

function verifySettings(structure: GUIStructure, settings: Array<Setting<any>>) {
	const issues: IInfoPopup[] = []
	for (const el of structure) {
		switch (el.type) {
			case 'group':
				issues.push(...verifySettings(el.children, settings))
				break
			case 'toggle': {
				const setting = settings.find(s => s.id === el.settingId)
				if (!setting) throw new Error(`No setting found with id "${el.settingId}"`)
				if (setting.value) issues.push(...verifySettings(el.active, settings))
				else issues.push(...verifySettings(el.inactive, settings))
				break
			}
			case 'setting': {
				const setting = settings.find(s => s.id === el.settingId)
				if (!setting) throw new Error(`No setting found with id "${el.settingId}"`)
				const info = setting.verify()
				if (info?.type !== 'error') continue
				issues.push({
					type: 'error',
					title: translate('animated_java.popup.failed_project_export_readiness.issue', [
						setting.displayName,
					]),
					lines: [info.title, ...info.lines],
				})
				break
			}
		}
	}
	return issues
}

export function verifyProjectExportReadiness() {
	const issues: IInfoPopup[] = []

	if (!Project) {
		// FIXME - Needs translation
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
		// FIXME - Needs translation
		issues.push({
			type: 'error',
			title: 'No Animated Java Settings Found',
			lines: ['No Animated Java settings found for this project'],
		})
		return
	}

	// Verify Project Settings
	issues.push(
		...verifySettings(
			projectSettingStructure,
			Object.values(Project.animated_java_settings) as unknown as Array<Setting<any>>
		)
	)

	// Verify Exporter Settings
	const exporter =
		AnimatedJavaExporter.exporters[
			Project.animated_java_settings.exporter.selected!.value as NamespacedString
		]
	if (!exporter)
		// FIXME - Needs translation
		issues.push({
			type: 'error',
			title: 'No Exporter Selected',
			lines: ['No exporter was selected for this project'],
		})
	else
		issues.push(
			...verifySettings(
				exporter.settingsStructure,
				Object.values(
					Project.animated_java_exporter_settings![exporter.id]
				) as unknown as Array<Setting<any>>
			)
		)

	// Verify variant keyframes
	for (const animation of Project.animations) {
		const effects = animation.animators.effects
		if (!effects) continue
		for (const keyframe of effects.keyframes) {
			if (!(keyframe.channel === 'variants')) continue
			for (const dataPoint of keyframe.data_points) {
				if (!dataPoint.variant) continue
				const variant = Project.animated_java_variants?.variants.find(
					v => v.uuid === dataPoint.variant
				)
				if (!variant) {
					// FIXME - Needs translation
					issues.push({
						type: 'error',
						title: 'Variant Not Found',
						lines: [
							`Variant UUID "${
								dataPoint.variant as string
							}" referenced in animation "${animation.name}" in a keyframe at ${
								keyframe.time
							} seconds, but no variant with that UUID was found.`,
						],
					})
				}
			}
		}
	}

	// Verify Outliner
	for (const node of Outliner.root as any[]) {
		if (
			node instanceof Group ||
			(OutlinerElement.types.camera && node instanceof OutlinerElement.types.camera) ||
			node instanceof Locator
		)
			continue
		// FIXME - Needs translation
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

	// Verify and clean textures
	for (const texture of Project.textures) {
		texture.name = texture.name.replace(/\.png$/, '')
	}

	if (issues.find(v => v.type === 'error')) {
		openAjFailedProjectExportReadinessDialog(issues)
		throw new ExpectedError('Project is not ready for export')
	}
}
