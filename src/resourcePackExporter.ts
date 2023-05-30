import { isValidResourcePackPath, safeFunctionName } from './minecraft'
import { CustomModelData, IRenderedRig } from './rendering/modelRenderer'
import { animatedJavaSettings } from './settings'
import { ExpectedError, LimitClock } from './util/misc'
import { ProgressBarController } from './util/progress'
import { translate } from './util/translation'
import { VirtualFolder } from './util/virtualFileSystem'

async function fileExists(path: string) {
	return !!(await fs.promises.stat(path).catch(() => false))
}

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

export async function exportResources(
	ajSettings: typeof animatedJavaSettings,
	projectSettings: NotUndefined<ModelProject['animated_java_settings']>,
	rig: IRenderedRig,
	rigExportFolder: string,
	textureExportFolder: string,
	rigItemModelExportPath: string
) {
	const advancedResourcePackSettingsEnabled =
		projectSettings.enable_advanced_resource_pack_settings.value
	const projectNamespace = projectSettings.project_namespace.value
	const resourcePackPath = PathModule.parse(projectSettings.resource_pack_mcmeta.value).dir
	const resourcePackFolder = new VirtualFolder(
		advancedResourcePackSettingsEnabled
			? 'internal_resource_pack_folder'
			: PathModule.basename(resourcePackPath),
		undefined,
		true
	)
	const assetsPackFolder = resourcePackFolder.newFolder('assets')

	//------------------------------------
	// Minecraft namespace
	//------------------------------------

	const [rigItemNamespace, rigItemName] = projectSettings.rig_item.value.split(':')
	const minecraftFolder = assetsPackFolder.newFolder('minecraft').newFolder('models/item')

	//------------------------------------
	// Empty Model
	//------------------------------------
	minecraftFolder.newFile('animated_java_empty.json', '{}')

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

	const predicateItemFilePath = advancedResourcePackSettingsEnabled
		? rigItemModelExportPath
		: PathModule.join(
				PathModule.dirname(resourcePackPath),
				minecraftFolder.path,
				`${rigItemName}.json`
		  )

	console.log('Predicate item file path:', predicateItemFilePath)

	// Default predicate item file content
	let content: IPredicateItemModel = {
		parent: 'item/generated',
		textures: {
			layer0: `${rigItemNamespace}:item/${rigItemName}`,
		},
		overrides: [],
		animated_java: {
			rigs: {},
		},
	}
	const usedIds: number[] = [] // IDs that are used by other projects
	const consumedIds: number[] = [] // IDs that are used by this project
	// Read predicate item file if it exists
	if (fs.existsSync(predicateItemFilePath)) {
		console.log('Reading predicate item file')
		try {
			const stringContent = await fs.promises.readFile(predicateItemFilePath, 'utf8')
			content = JSON.parse(stringContent)
		} catch (e) {
			console.warn('Failed to read predicate item file JSON')
			console.warn(e)
		}
		// Show overwrite confirmation if predicate file wasn't created by animated_java.
		if (!content.animated_java) {
			showPredicateFileOverwriteConfirmation(predicateItemFilePath)
			content.animated_java = {
				rigs: {
					ORIGINAL_PREDICATE_FILE: {
						used_ids: content.overrides
							.filter(o => o.predicate.custom_model_data !== undefined)
							.map(o => o.predicate.custom_model_data),
					},
				},
			}
			usedIds.push(...content.animated_java.rigs.ORIGINAL_PREDICATE_FILE.used_ids)
		}

		// Clean up content
		content.animated_java ??= { rigs: {} }
		content.animated_java.rigs ??= {}
		content.overrides = content.overrides.filter(o => o.predicate.custom_model_data !== 1)
		// Merge with existing predicate file
		console.log('Merging with existing predicate file')
		console.log(content)
		for (const [name, rig] of Object.entries(content.animated_java.rigs)) {
			const localUsedIds = rig.used_ids
			if (name === projectNamespace) {
				// Clean out old overrides
				content.overrides = content.overrides.filter(o => {
					return !localUsedIds.includes(o.predicate.custom_model_data)
				})
				continue
			}
			usedIds.push(...localUsedIds)
		}
	}

	if (!usedIds.includes(1)) usedIds.push(1)
	content.overrides.push({
		predicate: { custom_model_data: 1 },
		model: 'item/animated_java_empty',
	})

	CustomModelData.usedIds = usedIds
	content.animated_java.rigs[projectNamespace] = { used_ids: consumedIds }

	// Create virtual predicate item file with content
	const predicateItemFile = minecraftFolder.newFile(`${rigItemName}.json`, content)

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
		let image: Buffer | undefined
		let mcmeta: Buffer | undefined
		let optifineEmissive: Buffer | undefined
		if (texture.source?.startsWith('data:')) {
			image = Buffer.from(texture.source.split(',')[1], 'base64')
		} else if (texture.path && fs.existsSync(texture.path)) {
			if (!isValidResourcePackPath(texture.path)) {
				image = await fs.promises.readFile(texture.path)
				if (fs.existsSync(texture.path + '.mcmeta'))
					mcmeta = await fs.promises.readFile(texture.path + '.mcmeta')
				const emissivePath = texture.path.replace('.png', '') + '_e.png'
				if (fs.existsSync(emissivePath))
					optifineEmissive = await fs.promises.readFile(emissivePath)
			}
		} else {
			console.warn(`Texture "${texture.name}" has no source or path`)
		}

		if (image === undefined) continue

		const textureName = safeFunctionName(texture.name)
		texturesFolder.newFile(`${textureName}.png`, image)
		if (mcmeta) texturesFolder.newFile(`${textureName}.png.mcmeta`, mcmeta)
		if (optifineEmissive) texturesFolder.newFile(`${textureName}_e.png`, optifineEmissive)
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

	interface IAJMeta {
		datapack: object
		resourcepack: {
			projects: Record<string, { file_list: string[] }>
		}
	}

	async function processAJMeta(filePaths: string[]) {
		const ajMetaPath = PathModule.join(resourcePackPath, '.ajmeta')
		let content: IAJMeta | undefined

		// FIXME - This is an extremely hacky way to filter out the predicate item file from the file list
		filePaths = filePaths.filter(
			p =>
				p !==
				predicateItemFile.path
					.replace(resourcePackFolder.path + '/', '')
					.replaceAll('/', PathModule.sep)
		)

		if (await fileExists(ajMetaPath)) {
			content = await fs.promises
				.readFile(ajMetaPath, 'utf8')
				.then(JSON.parse)
				.catch(() => {
					throw new Error('Failed to read .ajmeta file as JSON')
				})
			if (!content)
				throw new Error('Failed to read .ajmeta file as JSON. Content is undefined.')

			// Upgrade from old format
			// @ts-ignore
			if (!content.resourcepack && content.projects) {
				// @ts-ignore
				content.resourcepack = {}
				content.datapack = {}
				// @ts-ignore
				content.resourcepack.projects = content.projects
				// @ts-ignore
				delete content.projects
			}

			if (!content.resourcepack.projects) {
				console.warn('Found existing .ajmeta file, but it is missing "projects" key.')
				content.resourcepack.projects = {}
			}

			if (!content.resourcepack.projects[NAMESPACE]) {
				console.warn('Found existing .ajmeta file, but it is missing this project.')
				content.resourcepack.projects[NAMESPACE] = {
					file_list: [],
				}
			} else {
				const progress = new ProgressBarController(
					'Cleaning up old Resource Pack files...',
					content.resourcepack.projects[NAMESPACE].file_list.length
				)
				// Clean out old files from disk
				const clock = new LimitClock(10)
				for (let path of content.resourcepack.projects[NAMESPACE].file_list) {
					await clock.sync().then(b => b && progress.update())
					path = PathModule.join(resourcePackPath, path)
					await fs.promises.unlink(path).catch(() => undefined)
					const dirPath = PathModule.dirname(path)
					const contents = await fs.promises.readdir(dirPath).catch(() => undefined)
					if (contents && contents.length === 0)
						await fs.promises.rmdir(dirPath).catch(() => undefined)
					progress.add(1)
				}
				progress.finish()
			}

			content.resourcepack.projects[NAMESPACE].file_list = filePaths
		}

		if (!content) {
			console.warn('.ajmeta does not exist. Creating new .ajmeta file.')
			content = {
				datapack: {},
				resourcepack: {
					projects: {
						[NAMESPACE]: {
							file_list: filePaths,
						},
					},
				},
			}
		}

		await fs.promises.writeFile(
			ajMetaPath,
			ajSettings.minify_output.value
				? JSON.stringify(content)
				: JSON.stringify(content, null, 4)
		)
	}

	if (advancedResourcePackSettingsEnabled) {
		const progress = new ProgressBarController(
			'Writing Resource Pack to Disk',
			modelsFolder.childCount + texturesFolder.childCount + 1
		)

		const filePaths = [...modelsFolder.getAllFilePaths(), ...texturesFolder.getAllFilePaths()]

		await processAJMeta(filePaths)

		await fs.promises.mkdir(rigExportFolder, { recursive: true })
		await modelsFolder.writeChildrenToDisk(rigExportFolder, {
			progress,
			skipEmptyFolders: true,
		})

		await fs.promises.mkdir(textureExportFolder, { recursive: true })
		await texturesFolder.writeChildrenToDisk(textureExportFolder, {
			progress,
			skipEmptyFolders: true,
		})

		const predicateItemExportFolder = PathModule.parse(rigItemModelExportPath).dir
		await fs.promises.mkdir(predicateItemExportFolder, { recursive: true })
		await predicateItemFile.writeToDisk(predicateItemExportFolder, {
			progress,
			skipEmptyFolders: true,
		})

		progress.finish()
	} else {
		console.log('Writing Resource Pack to Disk')
		const progress = new ProgressBarController(
			'Writing Resource Pack to Disk',
			assetsPackFolder.childCount
		)
		progress.update()

		const filePaths = resourcePackFolder.getAllFilePaths()

		await processAJMeta(filePaths)

		await assetsPackFolder.writeToDisk(resourcePackPath, { progress, skipEmptyFolders: true })

		progress.finish()
	}
}
