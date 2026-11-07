import { isRelativePath, normalizePath } from '../util/fileUtil'

export const COLLECTION_EXTENSION = 'bpcollection'
export const COLLECTION_FORMAT_VERSION = 1

export type CollectionExportMode = 'folder' | 'zip' | 'none'

/** The Blueprint settings a collection owns for all of its members. */
export interface CollectionSettings {
	target_minecraft_version: string
	resource_pack_export_mode: CollectionExportMode
	data_pack_export_mode: CollectionExportMode
	/** Relative (`./`, `../`) paths resolve against the collection file. */
	resource_pack: string
	/** Relative (`./`, `../`) paths resolve against the collection file. */
	data_pack: string
}

export const SHARED_SETTING_KEYS = [
	'target_minecraft_version',
	'resource_pack_export_mode',
	'data_pack_export_mode',
	'resource_pack',
	'data_pack',
] as const satisfies ReadonlyArray<keyof CollectionSettings>

export interface CollectionFile {
	format_version: number
	/** Tags the rigs this collection exports in a pack's `.ajmeta`, to find removed members. */
	uuid: string
	settings: CollectionSettings
	/** Member Blueprint paths, relative to the collection file. */
	blueprints: string[]
}

export class CollectionParseError extends Error {}

const EXPORT_MODES: CollectionExportMode[] = ['folder', 'zip', 'none']

function isObject(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * Validates a parsed `.bpcollection` file, filling missing settings from `defaults`.
 * @throws {CollectionParseError} When the file isn't a usable collection.
 */
export function parseCollection(json: unknown, defaults: CollectionSettings): CollectionFile {
	if (!isObject(json)) throw new CollectionParseError('Collection file must be a JSON object.')

	const version = json.format_version
	if (typeof version !== 'number') {
		throw new CollectionParseError('Collection file is missing its format_version.')
	}
	if (version > COLLECTION_FORMAT_VERSION) {
		throw new CollectionParseError(
			`Collection format version ${version} is newer than this version of Animated Java supports.`
		)
	}

	if (typeof json.uuid !== 'string' || json.uuid === '') {
		throw new CollectionParseError('Collection file is missing its uuid.')
	}

	const blueprints = json.blueprints ?? []
	if (!Array.isArray(blueprints) || blueprints.some(path => typeof path !== 'string')) {
		throw new CollectionParseError('Collection blueprints must be a list of paths.')
	}

	const rawSettings = json.settings ?? {}
	if (!isObject(rawSettings)) {
		throw new CollectionParseError('Collection settings must be an object.')
	}
	const settings = { ...defaults }
	for (const key of SHARED_SETTING_KEYS) {
		const value = rawSettings[key]
		if (value === undefined) continue
		if (typeof value !== 'string') {
			throw new CollectionParseError(`Collection setting "${key}" must be a string.`)
		}
		if (key.endsWith('_export_mode') && !EXPORT_MODES.includes(value as CollectionExportMode)) {
			throw new CollectionParseError(
				`Collection setting "${key}" must be one of: ${EXPORT_MODES.join(', ')}.`
			)
		}
		;(settings as Record<string, string>)[key] = value
	}

	return {
		format_version: COLLECTION_FORMAT_VERSION,
		uuid: json.uuid,
		settings,
		blueprints: blueprints as string[],
	}
}

export function serializeCollection(collection: CollectionFile): string {
	return JSON.stringify(collection, null, '\t') + '\n'
}

/**
 * `target` relative to the folder `fromFile` is in, `./`-prefixed so {@link isRelativePath}
 * recognizes it. Stays absolute when no relative path exists (another drive on Windows).
 */
export function relativeTo(fromFile: string, target: string): string {
	const relative = normalizePath(PathModule.relative(PathModule.dirname(fromFile), target))
	if (PathModule.isAbsolute(relative)) return relative
	return relative.startsWith('../') ? relative : './' + relative
}

/** Resolves a path stored in a file, where relative paths are relative to that file. */
export function resolveFrom(fromFile: string, path: string): string {
	if (!isRelativePath(path)) return path
	return normalizePath(PathModule.resolve(PathModule.dirname(fromFile), path))
}

/**
 * Rewrites a pack path stored in the collection so it means the same thing from a member
 * Blueprint. Absolute and env-variable paths are left as written.
 */
export function rebasePackPath(collectionPath: string, blueprintPath: string, path: string) {
	if (!isRelativePath(path)) return path
	return relativeTo(blueprintPath, resolveFrom(collectionPath, path))
}

/** The shared settings as a member Blueprint at `blueprintPath` should hold them. */
export function getMemberSettings(
	collection: CollectionFile,
	collectionPath: string,
	blueprintPath: string
): CollectionSettings {
	const { settings } = collection
	return {
		...settings,
		resource_pack: rebasePackPath(collectionPath, blueprintPath, settings.resource_pack),
		data_pack: rebasePackPath(collectionPath, blueprintPath, settings.data_pack),
	}
}

/** Absolute, normalized paths of the collection's members. */
export function resolveMemberPaths(collection: CollectionFile, collectionPath: string) {
	return collection.blueprints.map(path =>
		normalizePath(PathModule.resolve(PathModule.dirname(collectionPath), path))
	)
}

/** Paths that appear in `paths` more than once. */
export function findDuplicates(paths: string[]): string[] {
	const seen = new Set<string>()
	const duplicates = new Set<string>()
	for (const path of paths) {
		if (seen.has(path)) duplicates.add(path)
		seen.add(path)
	}
	return [...duplicates]
}
