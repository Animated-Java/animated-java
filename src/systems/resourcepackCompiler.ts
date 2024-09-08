import { MAX_PROGRESS, PROGRESS, PROGRESS_DESCRIPTION } from '../interface/exportProgressDialog'
import { isResourcePackPath, toSafeFuntionName } from '../util/minecraftUtil'
import { TRANSPARENT_TEXTURE } from '../variants'
import { IRenderedNodes, IRenderedRig } from './rigRenderer'
import { sortObjectKeys, zip } from './util'

class ResourcePackAJMeta {
	public files = new Set<string>()
	public oldFiles = new Set<string>()
	private oldContent: Record<string, { files?: string[] }> = {}

	constructor(
		public path: string,
		public exportNamespace: string,
		public lastUsedExportNamespace: string,
		public resourcePackFolder: string
	) {}

	read() {
		if (!fs.existsSync(this.path)) return
		this.oldContent = JSON.parse(fs.readFileSync(this.path, 'utf-8'))
		const data = this.oldContent[this.exportNamespace]
		const lastData = this.oldContent[this.lastUsedExportNamespace]
		if (lastData) {
			if (!Array.isArray(lastData.files)) lastData.files = []
			for (const file of lastData.files) {
				this.oldFiles.add(PathModule.join(this.resourcePackFolder, file))
			}
			delete this.oldContent[this.lastUsedExportNamespace]
		}
		if (data) {
			if (!Array.isArray(data.files)) data.files = []
			for (const file of data.files) {
				this.oldFiles.add(PathModule.join(this.resourcePackFolder, file))
			}
			delete this.oldContent[this.exportNamespace]
		}
	}

	write() {
		const folder = PathModule.dirname(this.path)
		const content: ResourcePackAJMeta['oldContent'] = {
			...this.oldContent,
			[this.exportNamespace]: {
				files: Array.from(this.files).map(v =>
					PathModule.relative(folder, v).replace(/\\/g, '/')
				),
			},
		}
		fs.writeFileSync(this.path, autoStringify(sortObjectKeys(content)))
	}
}

export async function compileResourcePack(options: {
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
		aj.id,
		lastUsedExportNamespace,
		options.resourcePackFolder
	)
	if (aj.resource_pack_export_mode === 'raw') {
		ajmeta.read()

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
	}

	const exportedFiles = new Map<string, string | Buffer>()

	// Internal Models
	exportedFiles.set(
		PathModule.join(resourcePackFolder, 'assets/animated_java/models/empty.json'),
		'{}'
	)

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

	// Transparent texture
	const transparentTexturePath = PathModule.join(
		resourcePackFolder,
		'assets/animated_java/textures/item/transparent.png'
	)
	exportedFiles.set(
		transparentTexturePath,
		nativeImage.createFromDataURL(TRANSPARENT_TEXTURE.source).toPNG()
	)

	// Variant Models
	for (const variant of Object.values(rig.variants)) {
		for (const [boneUuid, variantModel] of Object.entries(variant.models)) {
			const bone = rig.nodes[boneUuid] as IRenderedNodes['Bone']
			exportedFiles.set(
				PathModule.join(modelExportFolder, variant.name, bone.name + '.json'),
				autoStringify(variantModel.model)
			)
		}
	}

	if (aj.enable_plugin_mode) {
		// Do nothing
		console.log('Plugin mode enabled. Skipping resource pack export.')
	} else if (aj.resource_pack_export_mode === 'raw') {
		ajmeta.files = new Set(exportedFiles.keys())
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
