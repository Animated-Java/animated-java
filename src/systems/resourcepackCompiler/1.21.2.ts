import type { ResourcePackCompiler } from '.'
import { PROGRESS_DESCRIPTION } from '../../interface/dialog/exportProgress'
import { safeReadSync } from '../../util/fileUtil'
import { isResourcePackPath, sanitizeStorageKey } from '../../util/minecraftUtil'
import { type ITextureAtlas } from '../minecraft/textureAtlas'
import type { IRenderedNodes } from '../rigRenderer'

const compileResourcePack: ResourcePackCompiler = async ({
	coreFiles,
	versionedFiles,
	rig,
	textureExportFolder,
	modelExportFolder,
}) => {
	const correctedModelExportFolder = modelExportFolder.replace(
		/([\\/])blueprint([\\/])/,
		'$1item$2'
	)

	PROGRESS_DESCRIPTION.set('Compiling Resource Pack...')
	console.log('Compiling resource pack...', {
		rig,
		textureExportFolder,
		modelExportFolder,
	})

	// Texture atlas
	const blockAtlasPath = PathModule.join('assets/minecraft/atlases/blocks.json')
	const blockAtlas: ITextureAtlas = await fs.promises
		.readFile(blockAtlasPath, 'utf-8')
		.catch(() => {
			console.log('Creating new block atlas...')
			return JSON.stringify({ sources: [] })
		})
		.then(content => JSON.parse(content) as ITextureAtlas)

	if (
		!blockAtlas.sources?.some(
			source =>
				source.type === 'directory' &&
				source.source === 'blueprint' &&
				source.prefix === 'blueprint/'
		)
	) {
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

	// Empty model
	versionedFiles.set(PathModule.join('assets/animated_java/models/item/empty.json'), {
		content: '{}',
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
				image = safeReadSync(texture.path)
				if (image == undefined) {
					throw new Error(`Failed to read texture "${texture.name}" at ${texture.path}`)
				}
				mcmeta = safeReadSync(texture.path + '.mcmeta')
				optifineEmissive = safeReadSync(texture.path.replace('.png', '_e.png'))
			} else {
				// Don't copy the texture if it's already in a valid resource pack location.
				continue
			}
		}

		if (image === undefined) {
			throw new Error(`Texture ${texture.name} is missing it's image data.`)
		}

		let textureName = sanitizeStorageKey(texture.name)
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

	// Variant Models
	for (const variant of Object.values(rig.variants)) {
		for (const [boneUuid, variantModel] of Object.entries(variant.models)) {
			const bone = rig.nodes[boneUuid] as IRenderedNodes['Bone']
			if (variantModel.custom_model_data !== -1) continue
			const exportPath = variant.is_default
				? PathModule.join(correctedModelExportFolder, bone.name + '.json')
				: PathModule.join(correctedModelExportFolder, variant.name, bone.name + '.json')
			// Hacky workaround for this version enforcing the `item` namespace.
			if (variantModel.model?.parent) {
				variantModel.model.parent = variantModel.model.parent.replace(
					'animated_java:blueprint/',
					'animated_java:item/'
				)
			}
			variantModel.item_model = variantModel.item_model.replace(
				'animated_java:blueprint/',
				'animated_java:'
			)
			console.log('Exporting model', variantModel.model, 'to', exportPath)
			versionedFiles.set(PathModule.join(exportPath), {
				content: autoStringify(variantModel.model),
			})
		}
	}

	console.log('Resource pack compiled!')
}

export default compileResourcePack
