import { getFsModule } from '../../constants'
import { localize as translate } from '../../util/lang'
import { Variant } from '../../variants'
import { IntentionalExportError } from '../errors'
import { getAllJSONAssets } from '../minecraft/assetManager'
import {
	findItemModelAtlasProblems,
	getItemModelAtlases,
	type ITextureAtlas,
	type ItemModelAtlasProblem,
	type TextureAtlasEntry,
} from '../minecraft/textureAtlas'
import {
	getSlotTextureKey,
	getTextureResourceLocation,
	type IRenderedNodes,
	type IRenderedRig,
} from '../rigRenderer'
import type { IPaletteExport } from './palettes'

/** First version whose compiler gives each Texture Slot its own model, see `1.21.4.ts`. */
const SPLIT_SLOT_MODELS_MIN_VERSION = '1.21.4'

/** The source every compiler adds to the blocks atlas for Animated Java's own textures. */
const BLUEPRINT_ATLAS_SOURCE: TextureAtlasEntry = {
	type: 'directory',
	source: 'blueprint',
	prefix: 'blueprint/',
}

/**
 * Each atlas item models can use, built from the vanilla jar, the Preview resource packs, and the
 * pack being exported to, lowest priority first.
 */
async function loadItemModelAtlases(
	version: string,
	resourcePackFolder: string,
	paletteExport: IPaletteExport
) {
	const { readFile } = getFsModule().promises
	const atlases = new Map<string, TextureAtlasEntry[]>()
	for (const name of getItemModelAtlases(version)) {
		const path = `assets/minecraft/atlases/${name}.json`
		const layers = ((await getAllJSONAssets(version, path)) as ITextureAtlas[]).reverse()
		const exportPack = await readFile(PathModule.join(resourcePackFolder, path), 'utf-8')
			.then(content => JSON.parse(content) as ITextureAtlas)
			.catch(() => undefined)
		const sources = [...layers, exportPack].flatMap(atlas => atlas?.sources ?? [])
		if (name === 'blocks') sources.push(BLUEPRINT_ATLAS_SOURCE)
		// Reference sets are trusted to exist in some pack the player loads.
		sources.push(
			...(paletteExport.written[name] ?? []),
			...(paletteExport.referenced[name] ?? [])
		)
		atlases.set(name, sources)
	}
	return atlases
}

/**
 * The texture ids of every item model the resource pack compiler writes for the rig's bones.
 */
function getItemModelTextures(rig: IRenderedRig) {
	const splitsSlots = !compareVersions(
		SPLIT_SLOT_MODELS_MIN_VERSION,
		rig.target_minecraft_version
	)
	const defaultModels = rig.variants[Variant.getDefault().uuid]?.models ?? {}
	const models: Array<{ name: string; textures: string[] }> = []

	for (const [boneUuid, boneModel] of Object.entries(defaultModels)) {
		const model = boneModel.model
		if (!model) continue
		const bone = rig.nodes[boneUuid] as IRenderedNodes['Bone']
		const slots = Object.values(rig.texture_slots).filter(slot => slot.bones.includes(boneUuid))
		const slotKeys = new Set(slots.map(slot => getSlotTextureKey(slot.name)))

		const base: string[] = []
		for (const element of model.elements ?? []) {
			for (const face of Object.values(element.faces ?? {})) {
				const key = face.texture.replace(/^#/, '')
				if (slotKeys.has(key)) continue
				const id = model.textures[key]
				if (id) base.push(id)
			}
		}

		const slotModels = slots.map(slot => ({
			name: translate('misc.failed_to_export.item_model_atlases.slot', slot.name, bone.name),
			textures: slot.textures.map(
				texture =>
					getTextureResourceLocation(rig.textures[texture.id], rig).resourceLocation
			),
		}))

		const boneName = translate('misc.failed_to_export.item_model_atlases.bone', bone.name)
		if (splitsSlots) {
			models.push({ name: boneName, textures: base }, ...slotModels)
		} else {
			// Older compilers bake every slot texture into one model per variant.
			models.push({
				name: boneName,
				textures: [...base, ...slotModels.flatMap(m => m.textures)],
			})
		}
	}
	return models
}

function describeProblem(problem: ItemModelAtlasProblem, version: string) {
	if (problem.type === 'outside') {
		return translate(
			'misc.failed_to_export.item_model_atlases.outside',
			problem.model,
			getItemModelAtlases(version).join(', '),
			problem.textures.join(', ')
		)
	}
	const atlases = Object.entries(problem.atlases)
		.map(([atlas, textures]) => `${atlas} (${textures.join(', ')})`)
		.join(', ')
	return translate(
		'misc.failed_to_export.item_model_atlases.mixed',
		problem.model,
		atlases,
		version
	)
}

/**
 * Fails the export if any bone's item model uses textures Minecraft would render as missing, or,
 * from 1.21.11, mixes textures from the blocks and items atlases.
 */
export async function checkItemModelAtlases(
	rig: IRenderedRig,
	resourcePackFolder: string,
	paletteExport: IPaletteExport
) {
	const version = rig.target_minecraft_version
	const atlases = await loadItemModelAtlases(version, resourcePackFolder, paletteExport)
	const problems = findItemModelAtlasProblems(getItemModelTextures(rig), atlases, version)
	if (!problems.length) return

	const lines = problems.map(problem => describeProblem(problem, version))
	if (problems.some(problem => problem.type === 'outside')) {
		lines.push(translate('misc.failed_to_export.item_model_atlases.preview_pack_hint'))
	}
	throw new IntentionalExportError(
		translate('misc.failed_to_export.item_model_atlases.message', lines.join('\n\n'))
	)
}
