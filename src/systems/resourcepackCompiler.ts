import { isResourcePackPath, toSafeFuntionName } from '../util/minecraftUtil'
import { IRenderedAnimation } from './animationRenderer'
import { IRenderedNodes, IRenderedRig } from './rigRenderer'
import { replacePathPart } from './util'

interface IPredicateItemModel {
	parent: string
	textures: any
	overrides: Array<{
		predicate: { custom_model_data: number }
		model: string
	}>
	animated_java: {
		rigs: Record<string /* Rig Name */, { used_ids: number[] }>
	}
}

class PredicateItemModel {
	private lastOverrideId = 1
	private overrides = new Map<number, string>()
	public usedIds = new Set<number>()
	public rigs: Record<string, { used_ids: number[] }> = {}

	// constructor() {}

	setOverride(id: number, model: string) {
		if (!this.usedIds.has(id)) this.usedIds.add(id)
		this.overrides.set(id, model)
	}

	addOverride(model: string) {
		let id = this.lastOverrideId
		while (this.overrides.get(id) !== undefined) id++
		this.lastOverrideId = id
		this.usedIds.add(id)
		this.overrides.set(id, model)
		return id
	}

	assertOverride(id: number, model: string) {
		if (this.overrides.get(id) === undefined) this.setOverride(id, model)
	}

	readExisting(path: string) {
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
		file.animated_java ??= { rigs: {} }
		file.animated_java.rigs ??= {}

		for (const [name, rig] of Object.entries(file.animated_java.rigs)) {
			const namespace = Project!.animated_java.export_namespace
			const lastNamespace = Project!.last_used_export_namespace
			if (name === namespace || name === lastNamespace) {
				file.overrides = file.overrides.filter(
					override => !rig.used_ids.includes(override.predicate.custom_model_data)
				)
				if (name === lastNamespace && namespace !== lastNamespace)
					delete file.animated_java.rigs[lastNamespace]
				continue
			}

			rig.used_ids.forEach(id => this.usedIds.add(id))
			this.rigs[name] = rig
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
			overrides: [...this.overrides.entries()].map(([id, model]) => ({
				predicate: { custom_model_data: id },
				model,
			})),
			animated_java: {
				rigs: {
					...this.rigs,
					[exportNamespace]: {
						used_ids: [...this.usedIds.values()],
					},
				},
			},
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
			JSON.stringify(model)
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

		const textureName = toSafeFuntionName(texture.name)
		fs.writeFileSync(PathModule.join(textureExportFolder, textureName), image)
		if (mcmeta !== undefined)
			fs.writeFileSync(PathModule.join(textureExportFolder, textureName + '.mcmeta'), mcmeta)
		if (optifineEmissive !== undefined)
			fs.writeFileSync(
				PathModule.join(textureExportFolder, textureName + '_e.png'),
				optifineEmissive
			)
	}
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
				JSON.stringify(variantModel.model)
			)
		}
	}

	// Write display item model
	console.log('Display Item Model', displayItemModel.toJSON())
	fs.mkdirSync(PathModule.dirname(displayItemPath), { recursive: true })
	fs.writeFileSync(displayItemPath, JSON.stringify(displayItemModel.toJSON()))

	console.log('Resource pack compiled!')
}
