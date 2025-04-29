import type { ResourcePackCompiler } from '.'
import { PROGRESS_DESCRIPTION } from '../../interface/dialog/exportProgress'
import { isResourcePackPath, sanitizePathName } from '../../util/minecraftUtil'
import { Variant } from '../../variants'
import { IItemDefinition } from '../minecraft/itemDefinitions'
import { type ITextureAtlas } from '../minecraft/textureAtlas'
import { IRenderedNodes, IRenderedRig, IRenderedVariantModel } from '../rigRenderer'

const compileResourcePack: ResourcePackCompiler = async ({
	coreFiles,
	versionedFiles,
	rig,
	textureExportFolder,
	modelExportFolder,
}) => {
	const aj = Project!.animated_java

	PROGRESS_DESCRIPTION.set('Compiling Resource Pack...')
	console.log('Compiling resource pack...', {
		rig,
		textureExportFolder,
		modelExportFolder,
	})

	const globalModelsFolder = PathModule.join('assets/animated_java/models/')
	const itemModelDefinitionsFolder = PathModule.join(
		'assets/animated_java/items/blueprint/',
		aj.export_namespace
	)

	// Texture atlas
	const blockAtlasPath = PathModule.join('assets/minecraft/atlases/blocks.json')
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
	coreFiles.set(blockAtlasPath, {
		content: autoStringify(blockAtlas),
	})

	// Empty
	versionedFiles.set(PathModule.join(globalModelsFolder, 'empty.json'), { content: '{}' })
	versionedFiles.set(PathModule.join('assets/animated_java/items', 'empty.json'), {
		content: autoStringify({
			model: {
				type: 'minecraft:model',
				model: 'animated_java:empty',
			},
		}),
	})

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

		let textureName = sanitizePathName(texture.name)
		if (!texture.name.endsWith('.png')) textureName += '.png'
		versionedFiles.set(PathModule.join(textureExportFolder, textureName), { content: image })
		if (mcmeta !== undefined)
			versionedFiles.set(PathModule.join(textureExportFolder, textureName + '.mcmeta'), {
				content: mcmeta,
			})
		if (optifineEmissive !== undefined)
			versionedFiles.set(PathModule.join(textureExportFolder, textureName + '_e.png'), {
				content: optifineEmissive,
			})
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

		versionedFiles.set(exportPath, { content: autoStringify(itemDefinition) })
	}

	// Variant Models
	for (const variant of Object.values(rig.variants)) {
		for (const [boneUuid, variantModel] of Object.entries(variant.models)) {
			const bone = rig.nodes[boneUuid] as IRenderedNodes['Bone']
			if (variantModel.custom_model_data !== -1) continue
			const exportPath = variant.is_default
				? PathModule.join(modelExportFolder, bone.name + '.json')
				: PathModule.join(modelExportFolder, variant.name, bone.name + '.json')
			versionedFiles.set(PathModule.join(exportPath), {
				content: autoStringify(variantModel.model),
			})
		}
	}

	console.log('Resource pack compiled!')
}

export default compileResourcePack

function createSingleVariantItemDefinition(model: IRenderedVariantModel): IItemDefinition {
	return {
		model: {
			type: 'minecraft:model',
			model: model.resource_location,
			tints: [new oneLiner({ type: 'minecraft:dye', default: [1, 1, 1] })],
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
			cases: [
				{
					when: 'AJ_INTERNAL_EMPTY',
					model: {
						type: 'minecraft:model',
						model: 'animated_java:empty',
					},
				},
			],
			fallback: {
				type: 'minecraft:model',
				model: model.resource_location,
				tints: [new oneLiner({ type: 'minecraft:dye', default: [1, 1, 1] })],
			},
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
				tints: [new oneLiner({ type: 'minecraft:dye', default: [1, 1, 1] })],
			},
		} as (typeof itemDefinition.model.cases)[0])
	}

	if (itemDefinition.model.cases.length === 0) {
		return createSingleVariantItemDefinition(model)
	}

	return itemDefinition
}
