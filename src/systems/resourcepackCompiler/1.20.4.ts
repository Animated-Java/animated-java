import { MAX_PROGRESS, PROGRESS, PROGRESS_DESCRIPTION } from '../../interface/dialog/exportProgress'
import { isResourcePackPath, toSafeFuntionName } from '../../util/minecraftUtil'
import { IntentionalExportError } from '../exporter'
import { ITextureAtlas } from '../minecraft/textureAtlas'
import { IRenderedNodes, IRenderedRig } from '../rigRenderer'
import { sortObjectKeys, zip } from '../util'
import { ResourcePackAJMeta } from './global'

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
	public lastOverrideId = 1
	private overrides = new Map<number, string>()
	private externalOverrides = new Map<number, string>()
	public rigs: Record<string, number[]> = {}
	public parent? = 'item/generated'
	public textures: IPredicateItemModel['textures'] = {}

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
		let file: IPredicateItemModel
		try {
			file = JSON.parse(fs.readFileSync(path, 'utf-8'))
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

		file.animated_java[aj.export_namespace] ??= []

		for (const [name, ownedIds] of Object.entries(file.animated_java)) {
			const namespace = aj.export_namespace
			const lastNamespace = Project!.last_used_export_namespace
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
		const exportNamespace = Project!.animated_java.export_namespace

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
export default async function compileResourcePack(options: {
	rig: IRenderedRig
	displayItemPath: string
	resourcePackFolder: string
	textureExportFolder: string
	modelExportFolder: string
}) {
	const { rig, displayItemPath, resourcePackFolder, textureExportFolder, modelExportFolder } =
		options
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
	if (aj.resource_pack_export_mode === 'raw') {
		ajmeta.read()
	}

	const exportedFiles = new Map<string, string | Buffer>()

	// Internal Models
	exportedFiles.set(
		PathModule.join(resourcePackFolder, 'assets/animated_java/models/empty.json'),
		'{}'
	)

	// Display Item
	const displayItemModel = new PredicateItemModel()
	if (fs.existsSync(displayItemPath)) {
		console.warn('Display item already exists! Attempting to merge...')
		displayItemModel.readExisting(displayItemPath)
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
			exportedFiles.set(PathModule.join(exportPath), autoStringify(variantModel.model))
		}
	}

	if (aj.enable_plugin_mode) {
		// Do nothing
		console.log('Plugin mode enabled. Skipping resource pack export.')
	} else if (aj.resource_pack_export_mode === 'raw') {
		// Cleanup old files
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

		// Since we don't want to erase the display item every export, we add it's model file after the files have been added to the ajmeta.
		console.log('Display Item Model', displayItemModel.toJSON())
		exportedFiles.set(displayItemPath, autoStringify(displayItemModel.toJSON()))

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
