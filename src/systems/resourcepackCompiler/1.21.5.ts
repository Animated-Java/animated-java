import { MAX_PROGRESS, PROGRESS, PROGRESS_DESCRIPTION } from '../../interface/dialog/exportProgress'
import { isResourcePackPath, toSafeFuntionName } from '../../util/minecraftUtil'
import { Variant } from '../../variants'
import { IntentionalExportError } from '../exporter'
import { IItemDefinition } from '../minecraft/itemDefinitions'
import { type ITextureAtlas } from '../minecraft/textureAtlas'
import { IRenderedNodes, IRenderedRig, IRenderedVariantModel } from '../rigRenderer'
import { zip } from '../util'
import { ResourcePackAJMeta } from './global'

export default async function compileResourcePack(options: {
	rig: IRenderedRig
	resourcePackFolder: string
	textureExportFolder: string
	modelExportFolder: string
}) {
	const { rig, resourcePackFolder, textureExportFolder, modelExportFolder } = options
	const aj = Project!.animated_java
	const lastUsedExportNamespace = Project!.last_used_export_namespace
	PROGRESS_DESCRIPTION.set('Compiling Resource Pack...')
	console.log('Compiling resource pack...', options)

	const ajmeta = new ResourcePackAJMeta(
		PathModule.join(options.resourcePackFolder, 'assets.ajmeta'),
		aj.export_namespace,
		lastUsedExportNamespace,
		options.resourcePackFolder
	)
	ajmeta.read()

	const exportedFiles = new Map<string, string | Buffer>()

	const globalModelsFolder = PathModule.join(resourcePackFolder, 'assets/animated_java/models/')
	const itemModelDefinitionsFolder = PathModule.join(
		resourcePackFolder,
		'assets/animated_java/items/blueprint/',
		aj.export_namespace
	)

	// Texture atlas
	const blockAtlasPath = PathModule.join(
		resourcePackFolder,
		'assets/minecraft/atlases/blocks.json'
	)
	const blockAtlas: ITextureAtlas = await fs.promises
		.readFile(blockAtlasPath, 'utf-8')
		.catch(() => {
			console.log('Creating new block atlas...')
			return '{ "sources": [] }'
		})
		.then(content => JSON.parse(content) as ITextureAtlas)

	if (
		blockAtlas.sources?.some(
			source =>
				source.type === 'directory' &&
				source.source === 'blueprint' &&
				source.prefix === 'blueprint/'
		)
	) {
		// Do nothing. The blueprint directory is already there.
	} else {
		blockAtlas.sources ??= []
		blockAtlas.sources.push({
			type: 'directory',
			source: 'blueprint',
			prefix: 'blueprint/',
		})
	}
	exportedFiles.set(blockAtlasPath, autoStringify(blockAtlas))

	// Internal Models
	exportedFiles.set(PathModule.join(globalModelsFolder, 'empty.json'), '{}')

	// Textures
	for (const texture of Object.values(rig.textures)) {
		let image: Buffer | undefined
		let mcmeta: Buffer | undefined
		let optifineEmissive: Buffer | undefined
		if (texture.source?.startsWith('data:')) {
			image = Buffer.from(texture.source.split(',')[1], 'base64')
		} else if (texture.path && fs.existsSync(texture.path)) {
			if (!isResourcePackPath(texture.path)) {
				image = fs.readFileSync(texture.path)
				const mcmetaPath = texture.path + '.mcmeta'
				const emissivePath = texture.path.replace('.png', '_e.png')
				if (fs.existsSync(mcmetaPath)) mcmeta = fs.readFileSync(mcmetaPath)
				if (fs.existsSync(emissivePath)) optifineEmissive = fs.readFileSync(emissivePath)
			} else {
				// Don't copy the texture if it's already in a valid resource pack location.
				continue
			}
		}

		if (image === undefined) {
			throw new Error(`Texture ${texture.name} is missing it's image data.`)
		}

		let textureName = toSafeFuntionName(texture.name)
		if (!texture.name.endsWith('.png')) textureName += '.png'
		exportedFiles.set(PathModule.join(textureExportFolder, textureName), image)
		if (mcmeta !== undefined)
			exportedFiles.set(PathModule.join(textureExportFolder, textureName + '.mcmeta'), mcmeta)
		if (optifineEmissive !== undefined)
			exportedFiles.set(
				PathModule.join(textureExportFolder, textureName + '_e.png'),
				optifineEmissive
			)
	}

	// Item Model Definitions
	const defaultVariant = Variant.getDefault()

	for (const [boneUuid, model] of Object.entries(rig.variants[defaultVariant.uuid].models)) {
		const bone = rig.nodes[boneUuid] as IRenderedNodes['Bone']
		const exportPath = PathModule.join(itemModelDefinitionsFolder, bone.name + '.json')

		let itemDefinition: IItemDefinition

		if (Object.values(rig.variants).length === 1) {
			itemDefinition = createSingleVariantItemDefinition(model)
		} else {
			itemDefinition = createMultiVariantItemDefinition(boneUuid, model, rig)
		}

		exportedFiles.set(exportPath, autoStringify(itemDefinition))
	}

	// Variant Models
	for (const variant of Object.values(rig.variants)) {
		for (const [boneUuid, variantModel] of Object.entries(variant.models)) {
			const bone = rig.nodes[boneUuid] as IRenderedNodes['Bone']
			if (variantModel.custom_model_data !== -1) continue
			const exportPath = variant.is_default
				? PathModule.join(modelExportFolder, bone.name + '.json')
				: PathModule.join(modelExportFolder, variant.name, bone.name + '.json')
			exportedFiles.set(PathModule.join(exportPath), autoStringify(variantModel.model))
		}
	}

	if (aj.enable_plugin_mode) {
		// Do nothing
		console.log('Plugin mode enabled. Skipping resource pack export.')
	} else if (aj.resource_pack_export_mode === 'raw') {
		// Clean up old files
		PROGRESS_DESCRIPTION.set('Removing Old Resource Pack Files...')
		PROGRESS.set(0)
		MAX_PROGRESS.set(ajmeta.oldFiles.size)

		const removedFolders = new Set<string>()
		for (const file of ajmeta.oldFiles) {
			if (fs.existsSync(file)) await fs.promises.unlink(file)
			let folder = PathModule.dirname(file)
			while (
				!removedFolders.has(folder) &&
				fs.existsSync(folder) &&
				(await fs.promises.readdir(folder)).length === 0
			) {
				await fs.promises.rm(folder, { recursive: true })
				removedFolders.add(folder)
				folder = PathModule.dirname(folder)
			}
			PROGRESS.set(PROGRESS.get() + 1)
		}

		// Write new files
		ajmeta.files = new Set(exportedFiles.keys())
		ajmeta.files.delete(blockAtlasPath)
		ajmeta.write()

		PROGRESS_DESCRIPTION.set('Writing Resource Pack...')
		PROGRESS.set(0)
		MAX_PROGRESS.set(exportedFiles.size)
		const createdFolderCache = new Set<string>()

		for (const [path, data] of exportedFiles) {
			const folder = PathModule.dirname(path)
			if (!createdFolderCache.has(folder)) {
				await fs.promises.mkdir(folder, { recursive: true })
				createdFolderCache.add(folder)
			}
			await fs.promises.writeFile(path, data)
			PROGRESS.set(PROGRESS.get() + 1)
		}
	} else if (aj.resource_pack_export_mode === 'zip') {
		exportedFiles.set(
			PathModule.join(resourcePackFolder, 'pack.mcmeta'),
			autoStringify({
				pack: {
					// FIXME - This should be a setting
					pack_format: 32,
					description: `${Project!.name}. Generated with Animated Java`,
				},
			})
		)

		PROGRESS_DESCRIPTION.set('Writing Resource Pack Zip...')
		const data: Record<string, Uint8Array> = {}
		for (const [path, file] of exportedFiles) {
			const relativePath = PathModule.relative(resourcePackFolder, path)
			if (typeof file === 'string') {
				data[relativePath] = Buffer.from(file)
			} else {
				data[relativePath] = file
			}
		}
		const zipped = await zip(data, {})
		await fs.promises.writeFile(
			resourcePackFolder + (resourcePackFolder.endsWith('.zip') ? '' : '.zip'),
			zipped
		)
	}

	console.log('Resource pack compiled!')
}

function createSingleVariantItemDefinition(model: IRenderedVariantModel): IItemDefinition {
	return {
		model: {
			type: 'minecraft:model',
			model: model.resource_location,
			tints: [
				{
					type: 'minecraft:dye',
					default: [1, 1, 1],
				},
			],
		},
	}
}

function createMultiVariantItemDefinition(
	boneUUID: string,
	model: IRenderedVariantModel,
	rig: IRenderedRig
): IItemDefinition {
	const itemDefinition: IItemDefinition & {
		model: { type: 'minecraft:select'; property: 'minecraft:custom_model_data' }
	} = {
		model: {
			type: 'minecraft:select',
			property: 'minecraft:custom_model_data',
			cases: [],
			fallback: {
				type: 'minecraft:model',
				model: model.resource_location,
			},
			tints: [
				{
					type: 'minecraft:dye',
					default: [1, 1, 1],
				},
			],
		},
	}

	for (const variant of Object.values(rig.variants)) {
		const variantModel = variant.models[boneUUID]
		if (!variantModel || variant.is_default) continue
		itemDefinition.model.cases.push({
			when: variant.name,
			model: {
				type: 'minecraft:model',
				model: variantModel.resource_location,
			},
		} as (typeof itemDefinition.model.cases)[0])
	}

	if (itemDefinition.model.cases.length === 0) {
		return createSingleVariantItemDefinition(model)
	}

	return itemDefinition
}
