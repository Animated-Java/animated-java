import type { ResourcePackCompiler } from '.'
import { getFsModule } from '../../constants'
import { setExportProgressPhase } from '../../dialogs/exportProgress/exportProgress'
import {
	isResourcePackPath,
	parseResourceLocation,
	parseResourcePackPath,
	sanitizeStorageKey,
} from '../../util/minecraftUtil'
import { Variant } from '../../variants'
import type { IItemDefinition, TintSource } from '../minecraft/itemDefinitions'
import { type ITextureAtlas } from '../minecraft/textureAtlas'
import {
	getSlotTextureKey,
	getTextureResourceLocation,
	type IRenderedNodes,
	MODEL_CREDIT,
} from '../rigRenderer'
import {
	createTextureSlotItemDefinition,
	type ISlotItemModel,
	splitModelByTextureSlot,
} from './textureSlotModels'

const compileResourcePack: ResourcePackCompiler = async ({
	coreFiles,
	versionedFiles,
	rig,
	resourcePackPath,
	textureExportFolder,
	modelExportFolder,
}) => {
	const aj = Project!.animated_java

	setExportProgressPhase('Compiling Resource Pack...')
	console.log('Compiling resource pack...', {
		rig,
		textureExportFolder,
		modelExportFolder,
	})

	const parsed = parseResourceLocation(aj.blueprint_id)
	const itemModelDefinitionsFolder = PathModule.join(
		'assets',
		parsed.namespace,
		'items',
		'blueprint',
		parsed.path
	)

	const { existsSync, promises } = getFsModule()
	const { readFile } = promises

	// Texture atlas
	const blockAtlasPath = 'assets/minecraft/atlases/blocks.json'
	const blockAtlas: ITextureAtlas = await readFile(
		PathModule.join(resourcePackPath, blockAtlasPath),
		'utf-8'
	)
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

	// Textures
	for (const texture of Object.values(rig.textures)) {
		let image: Buffer | undefined
		let mcmeta: Buffer | undefined
		let optifineEmissive: Buffer | undefined
		if (texture.source?.startsWith('data:')) {
			image = Buffer.from(texture.source.split(',')[1], 'base64')
		} else if (texture.path && existsSync(texture.path)) {
			if (!isResourcePackPath(texture.path)) {
				image = await readFile(texture.path)
				const mcmetaPath = texture.path + '.mcmeta'
				const emissivePath = texture.path.replace('.png', '_e.png')
				if (existsSync(mcmetaPath)) mcmeta = await readFile(mcmetaPath)
				if (existsSync(emissivePath)) optifineEmissive = await readFile(emissivePath)
			} else {
				// Don't copy the texture if it's already in a valid resource pack location.
				continue
			}
		}

		if (image === undefined) {
			throw new Error(`Texture ${texture.name} is missing it's image data.`)
		}

		let textureName = texture.name.replace(/\.png$/, '')
		textureName = sanitizeStorageKey(textureName) + '.png'

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

	// Bone models and item definitions. Variants only switch Texture Slots here, so they don't
	// need models of their own.
	const writeModel = (path: string, model: object) => {
		versionedFiles.set(path, { content: autoStringify(model) })
		const parsed = parseResourcePackPath(path)
		if (!parsed) throw new Error(`Invalid model path: '${path}'`)
		return parsed.resourceLocation
	}

	const defaultModels = rig.variants[Variant.getDefault().uuid].models
	for (const [boneUuid, boneModel] of Object.entries(defaultModels)) {
		const bone = rig.nodes[boneUuid] as IRenderedNodes['Bone']
		const tints = getTints(bone.itemModelProperties)
		const basePath = PathModule.join(modelExportFolder, bone.name + '.json')
		const itemDefinitionPath = PathModule.join(itemModelDefinitionsFolder, bone.name + '.json')

		const boneSlots = Object.values(rig.texture_slots)
			.filter(slot => slot.bones.includes(boneUuid))
			.sort((a, b) => a.index - b.index)

		if (!boneSlots.length) {
			const model = writeModel(basePath, boneModel.model!)
			const itemDefinition: IItemDefinition = {
				model: { type: 'minecraft:model', model, tints },
			}
			versionedFiles.set(itemDefinitionPath, { content: autoStringify(itemDefinition) })
			continue
		}

		const split = splitModelByTextureSlot(
			boneModel.model!,
			new Set(boneSlots.map(slot => getSlotTextureKey(slot.name)))
		)
		const baseModel = split.base && writeModel(basePath, split.base)

		const slots: ISlotItemModel[] = boneSlots.map(slot => {
			const key = getSlotTextureKey(slot.name)
			const slotFolder = PathModule.join(modelExportFolder, bone.name, slot.name)
			const defaultModel = writeModel(slotFolder + '.json', split.slots[key])

			const textureModels: Record<string, string> = {}
			for (const texture of slot.textures.slice(1)) {
				textureModels[texture.name] = writeModel(
					PathModule.join(slotFolder, texture.name + '.json'),
					{
						credit: MODEL_CREDIT,
						parent: defaultModel,
						textures: {
							[key]: getTextureResourceLocation(rig.textures[texture.id], rig)
								.resourceLocation,
						},
					}
				)
			}
			return { index: slot.index, defaultModel, textureModels }
		})

		const itemDefinition = createTextureSlotItemDefinition({ baseModel, slots, tints })
		versionedFiles.set(itemDefinitionPath, { content: autoStringify(itemDefinition) })
	}

	console.log('Resource pack compiled!')
}

export default compileResourcePack

function getTints(itemModelProperties?: { tints: TintSource[] }): TintSource[] {
	if (itemModelProperties?.tints.length) return itemModelProperties.tints
	return [new oneLiner({ type: 'minecraft:dye', default: [1, 1, 1] })]
}
