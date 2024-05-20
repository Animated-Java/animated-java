import { isResourcePackPath, toSafeFuntionName } from '../util/minecraftUtil'
import { TRANSPARENT_TEXTURE } from '../variants'
import { IRenderedAnimation } from './animationRenderer'
import { IRenderedNodes, IRenderedRig } from './rigRenderer'
import { replacePathPart, sortObjectKeys } from './util'

interface IPredicateItemModel {
	parent: string
	textures: any
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

	// constructor() {}

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
			parent: 'item/generated',
			textures: {
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

export function compileResourcePack(options: {
	rig: IRenderedRig
	animations: IRenderedAnimation[]
	displayItemPath: string
	resourcePackFolder: string
	textureExportFolder: string
	modelExportFolder: string
	dataPackFolder: string
}) {
	const {
		rig,
		// animations,
		displayItemPath,
		resourcePackFolder,
		textureExportFolder,
		modelExportFolder,
		// dataPackFolder,
	} = options
	const aj = Project!.animated_java
	const lastUsedExportNamespace = Project!.last_used_export_namespace
	console.log('Compiling resource pack...', options)

	// Internal Models
	fs.mkdirSync(PathModule.join(resourcePackFolder, 'assets/animated_java/models/'), {
		recursive: true,
	})
	fs.writeFileSync(
		PathModule.join(resourcePackFolder, 'assets/animated_java/models/empty.json'),
		'{}'
	)

	// Display Item
	const displayItemModel = new PredicateItemModel()
	if (fs.existsSync(displayItemPath)) {
		console.warn('Display item already exists! Attempting to merge...')
		displayItemModel.readExisting(displayItemPath)
	}
	displayItemModel.lastOverrideId = Math.max(1, aj.customModelDataOffset)

	// Empty model for hiding bones / snowballs
	displayItemModel.assertOverride(1, 'animated_java:empty')

	// Models
	fs.rmSync(replacePathPart(modelExportFolder, aj.export_namespace, lastUsedExportNamespace), {
		recursive: true,
		force: true,
	})
	fs.mkdirSync(modelExportFolder, { recursive: true })
	for (const [boneUuid, model] of Object.entries(rig.models)) {
		const bone = rig.nodeMap[boneUuid] as IRenderedNodes['Bone']
		bone.customModelData = displayItemModel.addOverride(bone.resourceLocation)
		fs.writeFileSync(
			PathModule.join(modelExportFolder, bone.name + '.json'),
			autoStringify(model)
		)
	}

	// Textures
	fs.rmSync(replacePathPart(textureExportFolder, aj.export_namespace, lastUsedExportNamespace), {
		recursive: true,
		force: true,
	})
	fs.mkdirSync(textureExportFolder, { recursive: true })
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
		fs.writeFileSync(PathModule.join(textureExportFolder, textureName), image)
		if (mcmeta !== undefined)
			fs.writeFileSync(PathModule.join(textureExportFolder, textureName + '.mcmeta'), mcmeta)
		if (optifineEmissive !== undefined)
			fs.writeFileSync(
				PathModule.join(textureExportFolder, textureName + '_e.png'),
				optifineEmissive
			)
	}
	// Transparent texture
	fs.writeFileSync(
		PathModule.join(resourcePackFolder, 'assets/animated_java/textures/transparent.png'),
		nativeImage.createFromDataURL(TRANSPARENT_TEXTURE.source).toPNG(),
		'base64'
	)
	// Remove texture folder if it's empty - Doing it this way because I'm lazy.
	if (fs.readdirSync(textureExportFolder).length === 0) {
		fs.rmdirSync(textureExportFolder)
	}

	// Variant Models
	for (const [variantName, models] of Object.entries(rig.variantModels)) {
		fs.mkdirSync(PathModule.join(modelExportFolder, variantName), { recursive: true })
		for (const [boneUuid, variantModel] of Object.entries(models)) {
			const bone = rig.nodeMap[boneUuid] as IRenderedNodes['Bone']
			variantModel.customModelData = displayItemModel.addOverride(
				variantModel.resourceLocation
			)
			fs.writeFileSync(
				PathModule.join(modelExportFolder, variantName, bone.name + '.json'),
				autoStringify(variantModel.model)
			)
		}
	}

	// Write display item model
	console.log('Display Item Model', displayItemModel.toJSON())
	fs.mkdirSync(PathModule.dirname(displayItemPath), { recursive: true })
	fs.writeFileSync(displayItemPath, autoStringify(displayItemModel.toJSON()))

	console.log('Resource pack compiled!')
}
