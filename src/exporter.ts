import * as events from './events'
import { GUIStructure } from './guiStructure'
import { safeFunctionName } from './minecraft/util'
import { projectSettingStructure } from './projectSettings'
import { IRenderedAnimation, renderAllAnimations } from './rendering/animationRenderer'
import { CustomModelData, IRenderedRig, renderRig } from './rendering/modelRenderer'
import { animatedJavaSettings, IInfoPopup, Setting as AJSetting, Setting } from './settings'
import { openAjFailedProjectExportReadinessDialog } from './ui/popups/failedProjectExportReadiness'
import { openUnexpectedErrorDialog } from './ui/popups/unexpectedError'
import { consoleGroupCollapsed } from './util/console'
import { ExpectedError } from './util/misc'
import { NamespacedString } from './util/moddingTools'
import { ProgressBarController } from './util/progress'
import { translate } from './util/translation'
import { VirtualFolder } from './util/virtualFileSystem'

type ProjectSettings = Record<NamespacedString, AJSetting<any>>
type NotUndefined<T> = T extends undefined ? never : T

interface IAnimatedJavaExporterOptions<S extends ProjectSettings> {
	id: NamespacedString
	name: string
	description: string
	getSettings(): S
	settingsStructure: GUIStructure
	onStartup?: () => void
	export(
		ajSettings: typeof animatedJavaSettings,
		projectSettings: NotUndefined<ModelProject['animated_java_settings']>,
		exporterSettings: S,
		renderedAnimations: IRenderedAnimation[],
		rig: IRenderedRig
	): Promise<void> | void
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
	await exportProject().catch(e => {
		Blockbench.setProgress(0)
		Blockbench.setStatusBarText('')
		console.error(e)
		if (e instanceof ExpectedError) return
		openUnexpectedErrorDialog(e)
	})
	activelyExporting = false
}

export const exportProject = consoleGroupCollapsed('exportProject', async () => {
	verifyProjectExportReadiness()
	if (!Project?.animated_java_settings) return // Project being optional is annoying

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
			'assets/',
			projectNamespace + '_animated_java_rig',
			'/textures/item/'
		)
		rigExportFolder = PathModule.join(
			resourcePackFolder,
			'assets/',
			projectNamespace + '_animated_java_rig',
			'/models/item/'
		)
		rigItemModelExportPath = PathModule.join(
			resourcePackFolder,
			'assets/',
			projectNamespace + '_animated_java_rig',
			`/models/item/${rigItemId.split(':')[1]}.json`
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
	await exporter.export(ajSettings, projectSettings, exporterSettings, renderedAnimations, rig)

	Blockbench.showQuickMessage(translate('animated_java.quickmessage.exported_successfully'), 2000)
})

function showPredicateFileOverwriteConfirmation(path: string) {
	const result = confirm(
		translate('animated_java.popup.confirm_predicate_file_overwrite.body', {
			file: PathModule.parse(path).base,
			path,
		}),
		translate('animated_java.popup.confirm_predicate_file_overwrite.title')
	)
	if (!result) throw new ExpectedError('User cancelled export due to predicate file overwrite.')
}

async function exportResources(
	ajSettings: typeof animatedJavaSettings,
	projectSettings: NotUndefined<ModelProject['animated_java_settings']>,
	rig: IRenderedRig,
	rigExportFolder: string,
	textureExportFolder: string,
	rigItemModelExportPath: string
) {
	const projectNamespace = projectSettings.project_namespace.value
	const resourcePackPath = PathModule.parse(projectSettings.resource_pack_mcmeta.value).dir
	const assetsPackFolder = new VirtualFolder('assets')
	const advancedResourcePackSettingsEnabled =
		projectSettings.enable_advanced_resource_pack_settings.value

	//------------------------------------
	// Minecraft namespace
	//------------------------------------

	const [rigItemNamespace, rigItemName] = projectSettings.rig_item.value.split(':')

	const minecraftFolder = assetsPackFolder.newFolder('minecraft').newFolder('models/item')

	//------------------------------------
	// Rig Item Predicate File
	//------------------------------------

	interface IPredicateItemModel {
		parent: string
		textures: any
		overrides: Array<{
			predicate: { custom_model_data: number }
			model: string
		}>
		animated_java: {
			rigs: Record<string, { used_ids: number[] }>
		}
	}

	const predicateItemFilePath = PathModule.join(
		resourcePackPath,
		minecraftFolder.path,
		`${rigItemName}.json`
	)
	const content: IPredicateItemModel = {
		parent: 'item/generated',
		textures: {
			layer0: `${rigItemNamespace}:item/${rigItemName}`,
		},
		overrides: [],
		animated_java: {
			rigs: {},
		},
	}
	const predicateItemFile = minecraftFolder.newFile(`${rigItemName}.json`, content)
	let successfullyReadPredicateItemFile = false
	if (fs.existsSync(predicateItemFilePath)) {
		const stringContent = await fs.promises.readFile(predicateItemFilePath, 'utf8')
		try {
			const localContent = JSON.parse(stringContent)
			Object.assign(content, localContent)
			successfullyReadPredicateItemFile = true
		} catch (e) {
			console.warn('Failed to read predicate item file as JSON')
			console.warn(e)
		}
	} else successfullyReadPredicateItemFile = true
	if (!successfullyReadPredicateItemFile || !content.animated_java) {
		showPredicateFileOverwriteConfirmation(predicateItemFilePath)
	}
	if (!content.overrides) content.overrides = []
	if (!content.animated_java.rigs) content.animated_java.rigs = {}

	// const content = predicateItemFile.content as IPredicateItemModel
	const usedIds: number[] = [] // IDs that are used by other projects
	const consumedIds: number[] = [] // IDs that are used by this project
	for (const [name, rig] of Object.entries(content.animated_java.rigs)) {
		if (!rig.used_ids) {
			console.warn('Found existing rig in predicate file, but it is missing used_ids.')
			continue
		}
		const localUsedIds = rig.used_ids
		if (name === projectNamespace) {
			// Clean out old overrides
			content.overrides = content.overrides.filter(o => {
				return !localUsedIds.includes(o.predicate.custom_model_data)
			})
			continue
		}
		usedIds.push(...rig.used_ids)
	}

	CustomModelData.usedIds = usedIds
	content.animated_java.rigs[projectNamespace] = {
		used_ids: consumedIds,
	}

	//------------------------------------
	// Project namespace
	//------------------------------------

	const NAMESPACE = projectSettings.project_namespace.value
	const namespaceFolder = assetsPackFolder.newFolder(`${NAMESPACE}_animated_java_rig`)
	const [modelsFolder, texturesFolder] = namespaceFolder.newFolders(
		'models/item',
		'textures/item'
	)

	for (const texture of Object.values(rig.textures)) {
		let image: Buffer
		if (texture.source?.startsWith('data:')) {
			image = Buffer.from(texture.source.split(',')[1], 'base64')
		} else if (texture.path) {
			image = await fs.promises.readFile(texture.path)
		} else {
			throw new Error(`Texture "${texture.name}" has no source or path`)
		}
		texturesFolder.newFile(`${safeFunctionName(texture.name)}.png`, image)
		// console.log(`Exported texture ${texture.name} to ${texturesFolder.path}`)
	}

	for (const bone of Object.values(rig.nodeMap)) {
		if (bone.type !== 'bone') continue
		modelsFolder.newFile(`${bone.name}.json`, bone.model)
		consumedIds.push((bone.customModelData = CustomModelData.get()))
		predicateItemFile.content.overrides.push({
			predicate: {
				custom_model_data: bone.customModelData,
			},
			model: bone.resourceLocation,
		})
	}

	for (const [variantName, variantBoneMap] of Object.entries(rig.variantModels)) {
		if (variantBoneMap.default) continue
		const variantFolder = modelsFolder.newFolder(variantName)
		for (const [uuid, variantBone] of Object.entries(variantBoneMap)) {
			const bone = rig.nodeMap[uuid]
			if (bone.type !== 'bone') continue
			variantFolder.newFile(`${bone.name}.json`, variantBone.model)
			consumedIds.push((variantBone.customModelData = CustomModelData.get()))
			predicateItemFile.content.overrides.push({
				predicate: {
					custom_model_data: variantBone.customModelData,
				},
				model: variantBone.resourceLocation,
			})
		}
	}

	predicateItemFile.content.overrides.sort(
		(a: any, b: any) => a.predicate.custom_model_data - b.predicate.custom_model_data
	)

	if (advancedResourcePackSettingsEnabled) {
		const progress = new ProgressBarController(
			'Writing Resource Pack to Disk',
			modelsFolder.childCount + texturesFolder.childCount + 1
		)
		await fs.promises.mkdir(rigExportFolder, { recursive: true })
		await modelsFolder.writeChildrenToDisk(rigExportFolder, progress)

		await fs.promises.mkdir(textureExportFolder, { recursive: true })
		await texturesFolder.writeChildrenToDisk(textureExportFolder, progress)

		const predicateItemExportFolder = PathModule.parse(rigItemModelExportPath).dir
		await fs.promises.mkdir(predicateItemExportFolder, { recursive: true })
		await predicateItemFile.writeToDisk(predicateItemExportFolder, progress)

		progress.finish()
	} else {
		const progress = new ProgressBarController(
			'Writing Resource Pack to Disk',
			assetsPackFolder.childCount
		)

		const rigFolderPath = PathModule.join(resourcePackPath, namespaceFolder.path)
		await fs.promises
			.access(rigFolderPath)
			.then(async () => {
				await fs.promises.rm(rigFolderPath, { recursive: true })
			})
			.catch(e => {
				console.warn(e)
			})

		const textureFolderPath = PathModule.join(resourcePackPath, texturesFolder.path)
		await fs.promises
			.access(textureFolderPath)
			.then(async () => {
				await fs.promises.rm(textureFolderPath, { recursive: true })
			})
			.catch(e => {
				console.warn(e)
			})

		await assetsPackFolder.writeToDisk(resourcePackPath, progress)
		progress.finish()
	}
}

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
