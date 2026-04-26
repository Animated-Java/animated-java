import type { ResourcePackCompiler } from '.'
import { getFsModule } from '../../constants'
import { PROGRESS_DESCRIPTION } from '../../dialogs/exportProgress/exportProgress'
import { isResourcePackPath, sanitizeStorageKey } from '../../util/minecraftUtil'
import type { ITextureAtlas } from '../minecraft/textureAtlas'
import type { IRenderedNodes } from '../rigRenderer'
import { sortObjectKeys } from '../util'

interface IPredicateItemModel {
	parent?: string
	textures: Record<string, string>
	overrides: Array<{
		predicate: { custom_model_data: number }
		model: string
	}>
	animated_java: Record<string /* Rig Name */, number[]>
}

class PredicateItemModel {
	private overrides = new Map<number, string>()
	private externalOverrides = new Map<number, string>()

	lastOverrideId = 1
	rigs: Record<string, number[]> = {}
	parent? = 'item/generated'
	textures: IPredicateItemModel['textures'] = {}

	setOverride(id: number, model: string) {
		this.overrides.set(id, model)
	}

	addOverride(model: string) {
		let id = this.lastOverrideId
		while (this.overrides.has(id) || this.externalOverrides.has(id)) id++
		this.lastOverrideId = id
		this.overrides.set(id, model)
		return id
	}

	assertOverride(id: number, model: string) {
		if (!(this.overrides.has(id) || this.externalOverrides.has(id))) this.setOverride(id, model)
	}

	readExisting(path: string) {
		const aj = Project!.animated_java
		const { readFileSync } = getFsModule()

		let file: IPredicateItemModel
		try {
			file = JSON.parse(readFileSync(path, 'utf-8'))
		} catch (e) {
			console.error('Failed to read existing display item model:', e)
			return
		}

		if (typeof file.animated_java !== 'object') {
			// TODO Inform the user that they are attempting to merge into a non-animated_java model. And give them the option to cancel.
		}

		// Assert parent
		if (file.parent) this.parent = file.parent
		// Assert textures
		if (file.textures) this.textures = file.textures

		// Assert important fields
		file.overrides ??= []
		file.animated_java ??= {}
		// Update pre-1.0.0 format
		if (
			typeof file.animated_java.rigs === 'object' &&
			!Array.isArray(file.animated_java.rigs)
		) {
			const oldFormat = file.animated_java.rigs as unknown as Record<
				string,
				{ used_ids: number[] }
			>
			file.animated_java = {}
			for (const name of Object.keys(oldFormat)) {
				file.animated_java[name] = oldFormat[name].used_ids
			}
		}

		file.animated_java[aj.blueprint_id] ??= []

		for (const [name, ownedIds] of Object.entries(file.animated_java)) {
			const namespace = aj.blueprint_id
			const lastNamespace = Project!.last_used_blueprint_id
			if (name === namespace || name === lastNamespace) {
				file.overrides = file.overrides.filter(
					override => !ownedIds.includes(override.predicate.custom_model_data)
				)
				if (name === lastNamespace && namespace !== lastNamespace)
					delete file.animated_java[lastNamespace]
				continue
			} else {
				for (const id of ownedIds) {
					const override = file.overrides.find(o => o.predicate.custom_model_data === id)!
					this.externalOverrides.set(id, override.model)
				}
			}

			this.rigs[name] = ownedIds
		}
	}

	toJSON(): IPredicateItemModel {
		const [displayItemNamespace, displayItemName] =
			Project!.animated_java.display_item.split(':')
		const exportNamespace = Project!.animated_java.blueprint_id

		return {
			parent: this.parent,
			textures:
				Object.keys(this.textures).length > 0
					? this.textures
					: {
							layer0: `${displayItemNamespace}:item/${displayItemName}`,
						},
			overrides: [...this.externalOverrides.entries(), ...this.overrides.entries()]
				.sort((a, b) => a[0] - b[0])
				.map(([id, model]) => ({
					predicate: { custom_model_data: id },
					model,
				})),
			animated_java: sortObjectKeys({
				...this.rigs,
				[exportNamespace]: [...this.overrides.keys()],
			}),
		}
	}
}

const compileResourcePack: ResourcePackCompiler = async ({
	coreFiles,
	versionedFiles,
	rig,
	resourcePackPath,
	displayItemPath,
	textureExportFolder,
	modelExportFolder,
}) => {
	const aj = Project!.animated_java
	const { existsSync, promises } = getFsModule()
	const { readFile } = promises

	PROGRESS_DESCRIPTION.set('Compiling Resource Pack...')
	console.log('Compiling resource pack...', {
		rig,
		displayItemPath,
		textureExportFolder,
		modelExportFolder,
	})

	// Empty Model
	versionedFiles.set(PathModule.join('assets/animated_java/models/empty.json'), { content: '{}' })

	// Display Item
	const displayItemModel = new PredicateItemModel()
	const absoluteDisplayItemPath = PathModule.join(resourcePackPath, displayItemPath)
	if (existsSync(absoluteDisplayItemPath)) {
		console.warn('Display item already exists! Attempting to merge...')
		displayItemModel.readExisting(absoluteDisplayItemPath)
	}

	displayItemModel.lastOverrideId = Math.max(
		1,
		aj.enable_advanced_resource_pack_settings ? aj.custom_model_data_offset : 0
	)

	// Empty model for hiding bones / snowballs
	displayItemModel.assertOverride(1, 'animated_java:empty')

	// Textures
	for (const texture of Object.values(rig.textures)) {
		let image: Buffer | undefined
		let mcmeta: Buffer | undefined
		let optifineEmissive: Buffer | undefined
		if (texture.source?.startsWith('data:')) {
			image = Buffer.from(texture.source.split(',')[1], 'base64')
		} else if (texture.path && existsSync(texture.path)) {
			if (!isResourcePackPath(texture.path)) {
				image = await readFile(texture.path).catch(() => undefined)
				const mcmetaPath = texture.path + '.mcmeta'
				const emissivePath = texture.path.replace('.png', '_e.png')
				if (existsSync(mcmetaPath))
					mcmeta = await readFile(mcmetaPath).catch(() => undefined)
				if (existsSync(emissivePath))
					optifineEmissive = await readFile(emissivePath).catch(() => undefined)
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

	// Texture atlas
	const blockAtlasPath = PathModule.join('assets/minecraft/atlases/blocks.json')
	const blockAtlas: ITextureAtlas = await readFile(blockAtlasPath, 'utf-8')
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

	// Variant Models
	for (const variant of Object.values(rig.variants)) {
		for (const [boneUuid, variantModel] of Object.entries(variant.models)) {
			const bone = rig.nodes[boneUuid] as IRenderedNodes['Bone']
			if (variantModel.custom_model_data !== -1) continue
			variantModel.custom_model_data = displayItemModel.addOverride(
				variantModel.resource_location
			)
			const exportPath = variant.is_default
				? PathModule.join(modelExportFolder, bone.name + '.json')
				: PathModule.join(modelExportFolder, variant.name, bone.name + '.json')
			versionedFiles.set(PathModule.join(exportPath), {
				content: autoStringify(variantModel.model),
			})
		}
	}

	console.log('Display Item Model', displayItemModel.toJSON())
	versionedFiles.set(displayItemPath, {
		content: autoStringify(displayItemModel.toJSON()),
		// Don't include the display item in the AJMeta file, it has it's own system to handle merging.
		includeInAJMeta: false,
	})

	console.log('Resource pack compiled!')
}

export default compileResourcePack
