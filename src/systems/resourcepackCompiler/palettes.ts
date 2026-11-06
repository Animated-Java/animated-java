import {
	buildAtlasSource,
	encodeColorsAsPng,
	getGeneratedSource,
	getPaletteId,
	isReferenceSet,
	type IPaletteStrip,
	type PaletteSet,
} from '../../palettes'
import { makeUniqueName } from '../../util/uniqueName'
import { sanitizeStorageKey } from '../../util/minecraftUtil'
import type { AJMeta } from '../global'
import type { ITextureAtlas, TextureAtlasEntry } from '../minecraft/textureAtlas'
import { getTextureResourceLocation, type IRenderedRig } from '../rigRenderer'
import type { ExportedFile } from '../util'

export interface IPaletteExport {
	/** Atlas name -> sources this export writes into that atlas. */
	written: Record<string, TextureAtlasEntry[]>
	/** Atlas name -> sources of reference sets, which already exist in some pack. */
	referenced: Record<string, TextureAtlasEntry[]>
	/** Pack-relative path -> palette PNG. */
	files: Map<string, Buffer>
	/** The sets the rig uses. */
	sets: PaletteSet[]
}

/** Project sets' sources go in the blocks atlas, next to the base textures Animated Java exports. */
const PROJECT_SET_ATLAS = 'blocks'

/**
 * Where palettes are written: the texture export folder, under `textures/palettes/` so the files
 * work on every version.
 */
function getPaletteFolder(textureExportFolder: string) {
	const parts = textureExportFolder.replace(/\\/g, '/').split('/')
	const texturesIndex = parts.indexOf('textures')
	const namespace = parts[texturesIndex - 1]
	const path = parts.slice(texturesIndex + 1).join('/')
	return { namespace, path, folder: `assets/${namespace}/textures/palettes/${path}` }
}

/**
 * Collects the atlas sources and palette files for every Permutation Set the rig uses. Only bases
 * with a used recolor are listed, since those are the bases the rig exports.
 */
export function buildPaletteExport(rig: IRenderedRig, textureExportFolder: string): IPaletteExport {
	const version = rig.target_minecraft_version
	const used = new Map<PaletteSet, Set<string>>()
	for (const texture of Object.values(rig.textures)) {
		const source = getGeneratedSource(texture)
		if (!source) continue
		let bases = used.get(source.set)
		if (!bases) used.set(source.set, (bases = new Set()))
		bases.add(source.base)
	}

	const result: IPaletteExport = { written: {}, referenced: {}, files: new Map(), sets: [] }
	const palettes = getPaletteFolder(textureExportFolder)
	const folderNames: string[] = []

	for (const [set, usedBases] of used) {
		const data = set.palette_set
		result.sets.push(set)
		const bases = data.bases.filter(base => usedBases.has(base))

		if (isReferenceSet(set)) {
			const source = buildAtlasSource({
				bases,
				separator: data.separator,
				key: data.key.id!,
				permutations: Object.fromEntries(
					data.permutations.map(p => [p.suffix, p.strip.id!])
				),
			})
			;(result.referenced[data.reference!.atlas] ??= []).push(source as TextureAtlasEntry)
			continue
		}

		const folderName = makeUniqueName(sanitizeStorageKey(set.name), name =>
			folderNames.includes(name)
		)
		folderNames.push(folderName)

		const stripId = (strip: IPaletteStrip, fileName: string) => {
			if (strip.id) return strip.id
			const path = `${palettes.path}/${folderName}/${fileName}`
			result.files.set(
				`${palettes.folder}/${folderName}/${fileName}.png`,
				Buffer.from(encodeColorsAsPng(strip.colors ?? []))
			)
			return getPaletteId(palettes.namespace, path, version)
		}

		const baseIds = bases.map(uuid => {
			const texture = Texture.all.find(t => t.uuid === uuid)!
			return getTextureResourceLocation(texture, rig).resourceLocation
		})
		const source = buildAtlasSource({
			bases: baseIds,
			separator: data.separator,
			key: stripId(data.key, 'key'),
			permutations: Object.fromEntries(
				data.permutations.map(p => [p.suffix, stripId(p.strip, `palettes/${p.suffix}`)])
			),
		})
		;(result.written[PROJECT_SET_ATLAS] ??= []).push(source as TextureAtlasEntry)
	}

	return result
}

/** JSON with sorted keys, so sources compare equal however their keys were ordered. */
function stableStringify(value: unknown): string {
	if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`
	if (value && typeof value === 'object') {
		const entries = Object.entries(value).sort(([a], [b]) => a.localeCompare(b))
		return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${stableStringify(v)}`).join(',')}}`
	}
	return JSON.stringify(value)
}

/**
 * Writes a rig's palette sources into one of the pack's atlas files, and queues its palette images.
 * The sources the rig's previous export added (recorded in its `.ajmeta`) are removed first, so
 * re-exporting doesn't stack stale entries.
 */
export function applyPaletteExport(options: {
	atlasName: string
	atlas: ITextureAtlas
	paletteExport: IPaletteExport
	ajmeta: AJMeta
	versionedFiles: Map<string, ExportedFile>
}) {
	const { atlasName, atlas, paletteExport, ajmeta } = options
	const previous = new Set((ajmeta.previousAtlasSources[atlasName] ?? []).map(stableStringify))
	const added = paletteExport.written[atlasName] ?? []
	atlas.sources = [
		...(atlas.sources ?? []).filter(source => !previous.has(stableStringify(source))),
		...added,
	]
	ajmeta.atlasSources[atlasName] = added

	for (const [path, content] of paletteExport.files) {
		options.versionedFiles.set(path, { content })
	}
}
