import { getFsModule } from '../constants'
import { isFunctionTagPath } from '../util/fileUtil'
import type { FunctionTagJSON } from '../util/minecraftUtil'
import { IntentionalExportError } from './errors'
import type { SerializedAJMeta } from './global'
import { removeFiles, writeFileIfChanged } from './packFiles'

interface AtlasJSON {
	sources?: unknown[]
}
interface DisplayItemJSON {
	overrides?: Array<{ predicate?: { custom_model_data?: number } }>
	animated_java?: Record<string, number[]>
}

function readJSON<T>(path: string): T | undefined {
	const { existsSync, readFileSync } = getFsModule()
	if (!existsSync(path)) return
	try {
		return JSON.parse(readFileSync(path, 'utf-8')) as T
	} catch (e: any) {
		throw new IntentionalExportError(`Failed to parse '${path}' while removing a rig: ${e}`)
	}
}

function readAJMeta(path: string): SerializedAJMeta | undefined {
	const meta = readJSON<SerializedAJMeta>(path)
	if (meta?.formatVersion !== '1.0.0' || typeof meta.rigs !== 'object') return
	return meta
}

/** IDs of the rigs in a pack's `.ajmeta` that the collection with `uuid` exported. */
export function getCollectionRigs(ajmetaPath: string, uuid: string): string[] {
	const rigs = readAJMeta(ajmetaPath)?.rigs ?? {}
	return Object.entries(rigs)
		.filter(([, rig]) => rig.collection === uuid)
		.map(([id]) => id)
}

const sameSource = (a: unknown) => (b: unknown) => JSON.stringify(a) === JSON.stringify(b)

/**
 * Strips the rig's entries from a function tag, leaving the tag for other rigs.
 * @returns Whether the tag is left empty, and can be deleted.
 */
async function stripTag(path: string, blueprintId: string) {
	const tag = readJSON<FunctionTagJSON>(path)
	if (!tag?.values) return true
	tag.values = tag.values.filter(entry => {
		const id = typeof entry === 'string' ? entry : entry.id
		return !id.replace(/^#/, '').startsWith(`${blueprintId}/`)
	})
	if (tag.values.length === 0) return true
	await writeFileIfChanged(path, autoStringify(tag))
	return false
}

/** Removes the rig's palette sources from the atlas files it added them to. */
async function stripAtlasSources(packFolder: string, atlasSources: Record<string, unknown[]>) {
	for (const [atlasName, sources] of Object.entries(atlasSources)) {
		const path = PathModule.join(packFolder, 'assets/minecraft/atlases', `${atlasName}.json`)
		const atlas = readJSON<AtlasJSON>(path)
		if (!atlas?.sources) continue
		atlas.sources = atlas.sources.filter(source => !sources.some(sameSource(source)))
		await writeFileIfChanged(path, autoStringify(atlas))
	}
}

/** Removes the rig's `custom_model_data` overrides from pre-1.21.4 display item models. */
async function stripDisplayItemOverrides(packFolder: string, blueprintId: string) {
	const { existsSync, readdirSync } = getFsModule()
	const folder = PathModule.join(packFolder, 'assets/minecraft/models/item')
	if (!existsSync(folder)) return
	for (const name of readdirSync(folder)) {
		if (!name.endsWith('.json')) continue
		const path = PathModule.join(folder, name)
		const model = readJSON<DisplayItemJSON>(path)
		const ownedIds = model?.animated_java?.[blueprintId]
		if (!model || !Array.isArray(ownedIds)) continue
		model.overrides = model.overrides?.filter(
			o => !ownedIds.includes(o.predicate?.custom_model_data ?? -1)
		)
		delete model.animated_java![blueprintId]
		await writeFileIfChanged(path, autoStringify(model))
	}
}

/**
 * Removes a rig from an exported pack folder using only its `.ajmeta` entry: deletes its own
 * files, strips it from function tags, atlases and display item models, then drops the entry.
 * Core files (`animated_java:global`) are left for the pack's other rigs.
 * @param ajmetaPath The pack's `data.ajmeta` or `assets.ajmeta`.
 */
export async function removeRig(ajmetaPath: string, blueprintId: string) {
	const meta = readAJMeta(ajmetaPath)
	const rig = meta?.rigs?.[blueprintId]
	if (!meta || !rig) return

	const packFolder = PathModule.dirname(ajmetaPath)
	const files = (rig.versionedFiles ?? []).map(file => PathModule.join(packFolder, file))
	const removedFiles: string[] = []
	for (const file of files) {
		if (!isFunctionTagPath(file) || (await stripTag(file, blueprintId))) removedFiles.push(file)
	}
	await removeFiles(removedFiles)

	if (rig.atlasSources) await stripAtlasSources(packFolder, rig.atlasSources)
	await stripDisplayItemOverrides(packFolder, blueprintId)

	delete meta.rigs![blueprintId]
	getFsModule().writeFileSync(ajmetaPath, autoStringify(meta))
}
