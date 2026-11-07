import { getFsModule } from '../constants'
import { BLUEPRINT_FORMAT_ID, type IBlueprintFormatJSON } from '../formats/blueprint'
import { BLUEPRINT_CODEC } from '../formats/blueprint/codec'
import { upgradeAnimatedJavaBlueprint } from '../formats/blueprint/dfu'
import { type BlueprintSettings, defaultValues } from '../formats/blueprint/settings'
import { normalizePath } from '../util/fileUtil'
import { localize as translate } from '../util/lang'
import {
	COLLECTION_FORMAT_VERSION,
	type CollectionFile,
	type CollectionSettings,
	getMemberSettings,
	parseCollection,
	relativeTo,
	resolveMemberPaths,
	serializeCollection,
	SHARED_SETTING_KEYS,
} from './collectionFile'

export interface LoadedCollection {
	/** Absolute path to the `.bpcollection` file. */
	path: string
	file: CollectionFile
}

/** Thrown for collection problems the user can fix, with a message that says how. */
export class CollectionError extends Error {}

export const COLLECTION_FORMAT_ID = 'animated-java:format/collection'

/** A collection open in a project tab. Member paths are absolute. */
export interface CollectionProjectState {
	uuid: string
	settings: CollectionSettings
	members: string[]
	/** The members as last saved, to work out who to link and unlink on the next save. */
	savedMembers: string[]
}

declare module '@blockbench-types/generated/io/project' {
	export interface ModelProject {
		collection?: CollectionProjectState
	}
}

export function findOpenCollection(path: string) {
	return ModelProject.all.find(
		p => p.format.id === COLLECTION_FORMAT_ID && normalizePath(p.save_path) === path
	)
}

/** The collection a tab holds, unsaved edits included, as if it were saved at its path. */
export function collectionFromProject(project: ModelProject): LoadedCollection {
	const state = project.collection!
	const path = normalizePath(project.save_path)
	return {
		path,
		file: {
			format_version: COLLECTION_FORMAT_VERSION,
			uuid: state.uuid,
			settings: { ...state.settings },
			blueprints: state.members.map(member => relativeTo(path, member)),
		},
	}
}

/**
 * The collection at `path`: its open tab's state when it's open, else the file.
 * @throws {CollectionError} When it isn't open and the file is missing or invalid.
 */
export function getCollection(path: string): LoadedCollection {
	path = normalizePath(path)
	const project = findOpenCollection(path)
	return project ? collectionFromProject(project) : readCollection(path)
}

export function getCollectionDefaults(): CollectionSettings {
	return Object.fromEntries(
		SHARED_SETTING_KEYS.map(key => [key, defaultValues[key]])
	) as unknown as CollectionSettings
}

/**
 * @throws {CollectionError} When the file is missing or isn't a valid collection.
 */
export function readCollection(path: string): LoadedCollection {
	const { existsSync, readFileSync } = getFsModule()
	if (!existsSync(path)) {
		throw new CollectionError(translate('collection.error.missing_file', path))
	}
	try {
		const json = JSON.parse(readFileSync(path, 'utf-8'))
		return { path: normalizePath(path), file: parseCollection(json, getCollectionDefaults()) }
	} catch (e: any) {
		throw new CollectionError(translate('collection.error.invalid_file', path, e.message))
	}
}

export function writeCollection(collection: LoadedCollection) {
	getFsModule().writeFileSync(collection.path, serializeCollection(collection.file))
}

export function getMemberPaths(collection: LoadedCollection) {
	return resolveMemberPaths(collection.file, collection.path)
}

/** The absolute path of the collection `project` links to, if it links to one. */
export function getLinkedCollectionPath(project: ModelProject): string | undefined {
	const link = project.animated_java?.collection
	if (!link || !project.save_path) return
	return PathModule.resolve(PathModule.dirname(project.save_path), link)
}

/**
 * Reads the collection `project` links to.
 * @throws {CollectionError} When the link is broken, or the collection doesn't list the project.
 */
export function getLinkedCollection(project: ModelProject): LoadedCollection | undefined {
	const path = getLinkedCollectionPath(project)
	if (!path) return
	const collection = getCollection(path)
	if (!getMemberPaths(collection).includes(normalizePath(project.save_path))) {
		throw new CollectionError(translate('collection.error.not_listed', collection.path))
	}
	return collection
}

/** Overwrites `project`'s shared settings with the collection's. */
export function applyCollectionSettings(project: ModelProject, collection: LoadedCollection) {
	Object.assign(
		project.animated_java,
		getMemberSettings(collection.file, collection.path, project.save_path)
	)
}

/**
 * Applies the linked collection's settings to `project`.
 * @returns The collection, or undefined when `project` isn't linked to one.
 * @throws {CollectionError} When the link is broken.
 */
export function syncWithLinkedCollection(project: ModelProject) {
	const collection = getLinkedCollection(project)
	if (collection) applyCollectionSettings(project, collection)
	return collection
}

/** {@link syncWithLinkedCollection}, warning instead of throwing when the link is broken. */
export function trySyncWithLinkedCollection(project: ModelProject) {
	try {
		return syncWithLinkedCollection(project)
	} catch (e) {
		if (!(e instanceof CollectionError)) throw e
		Blockbench.showToastNotification({
			text: translate('collection.toast.broken_link', project.getDisplayName(), e.message),
			icon: 'warning',
			expire: 10000,
		})
	}
}

/** Opens the Blueprint file at `path` in a new tab, which becomes the active project. */
export function openBlueprintFile(path: string) {
	const model = JSON.parse(getFsModule().readFileSync(path, 'utf-8'))
	BLUEPRINT_CODEC.get()!.load!(model, { path, name: PathModule.basename(path) } as any)
	return Project!
}

export function findOpenBlueprint(path: string) {
	return ModelProject.all.find(
		p => p.format.id === BLUEPRINT_FORMAT_ID && normalizePath(p.save_path) === path
	)
}

/** Pushes the collection's settings into every member that's open right now. */
export function syncOpenMembers(collection: LoadedCollection) {
	for (const path of getMemberPaths(collection)) {
		const project = findOpenBlueprint(path)
		if (project) applyCollectionSettings(project, collection)
	}
}

interface BlueprintLinkState {
	pluginMode: boolean
	/** The collection the Blueprint links to, absolute, or undefined. */
	collection?: string
}

function readBlueprintFile(path: string): any {
	const { existsSync, readFileSync } = getFsModule()
	if (!existsSync(path)) {
		throw new CollectionError(translate('collection.error.missing_blueprint', path))
	}
	try {
		return JSON.parse(readFileSync(path, 'utf-8'))
	} catch (e: any) {
		throw new CollectionError(translate('collection.error.invalid_blueprint', path, e.message))
	}
}

/** Upgrades a copy, leaving `model` as it's stored on disk. */
function upgradeCopy(model: any): IBlueprintFormatJSON {
	return upgradeAnimatedJavaBlueprint(structuredClone(model))
}

/**
 * Reads a Blueprint that isn't open, upgraded to the current format so its settings can be read.
 * @throws {CollectionError} When the file is missing or unreadable.
 */
export function readClosedBlueprint(path: string): IBlueprintFormatJSON {
	return upgradeCopy(readBlueprintFile(path))
}

export function getLinkState(path: string): BlueprintLinkState {
	const project = findOpenBlueprint(path)
	const settings: Partial<BlueprintSettings> = project
		? project.animated_java
		: (readClosedBlueprint(path).blueprint_settings ?? {})
	return {
		pluginMode: !!settings.enable_plugin_mode,
		collection: settings.collection
			? normalizePath(PathModule.resolve(PathModule.dirname(path), settings.collection))
			: undefined,
	}
}

/** The Blueprint settings a collection writes into its members' files. */
type MemberSettingKey = 'collection' | 'blueprint_id'

/**
 * Writes one setting into a Blueprint file as stored, without upgrading it, so it stays loadable
 * by the version that saved it.
 * @throws {CollectionError} When the file's format keeps its settings where an upgrade would lose
 * the value.
 */
function writeSettingToFile(path: string, key: MemberSettingKey, value: string) {
	const model = readBlueprintFile(path)
	if (typeof model.blueprint_settings !== 'object' || model.blueprint_settings === null) {
		throw new CollectionError(translate('collection.error.outdated_blueprint', path))
	}
	model.blueprint_settings[key] = value
	if ((upgradeCopy(model).blueprint_settings?.[key] ?? defaultValues[key]) !== value) {
		throw new CollectionError(translate('collection.error.outdated_blueprint', path))
	}
	getFsModule().writeFileSync(path, compileJSON(model).toString())
}

/**
 * Sets a setting in the Blueprint's file, and in its project when it's open, so the change holds
 * even if the project is closed without saving.
 * @throws {CollectionError} When a closed Blueprint's file can't hold the value.
 */
function setMemberSetting(path: string, key: MemberSettingKey, value: string) {
	const project = findOpenBlueprint(path)
	if (!project) return writeSettingToFile(path, key, value)
	project.animated_java[key] = value
	try {
		writeSettingToFile(path, key, value)
	} catch (e) {
		if (!(e instanceof CollectionError)) throw e
		// Saving the project upgrades its file, which then holds the value.
		project.saved = false
	}
}

/**
 * The Blueprint ID of the Blueprint at `path`, from its tab when it's open.
 * @throws {CollectionError} When a closed Blueprint's file is missing or unreadable.
 */
export function getBlueprintId(path: string) {
	const project = findOpenBlueprint(path)
	if (project) return project.animated_java.blueprint_id
	return readClosedBlueprint(path).blueprint_settings?.blueprint_id ?? defaultValues.blueprint_id
}

/**
 * Changes the Blueprint ID in the Blueprint's file, and in its tab when it's open.
 * @throws {CollectionError} When a closed Blueprint's file can't hold the ID.
 */
export function setBlueprintId(path: string, id: string) {
	setMemberSetting(path, 'blueprint_id', id)
}

/**
 * @throws {CollectionError} When the Blueprint at `path` can't join the collection at
 * `collectionPath`.
 */
export function assertCanJoin(collectionPath: string, path: string, previousPath?: string) {
	const state = getLinkState(path)
	if (state.pluginMode) {
		throw new CollectionError(translate('collection.error.plugin_mode', path))
	}
	const ownPaths = [collectionPath, previousPath]
	if (state.collection && !ownPaths.includes(state.collection)) {
		throw new CollectionError(
			translate('collection.error.other_collection', path, state.collection)
		)
	}
}

/** Clears a former member's link, unless it links to some other collection. */
function unlink(collectionPaths: Array<string | undefined>, path: string) {
	try {
		const link = getLinkState(path).collection
		if (link && collectionPaths.includes(link)) setMemberSetting(path, 'collection', '')
	} catch (e) {
		// A member whose file is gone has no link left to clear.
		if (!(e instanceof CollectionError)) throw e
		console.warn(`Couldn't clear the collection link of '${path}':`, e.message)
	}
}

export interface SaveCollectionOptions {
	/** Where to write the collection. */
	path: string
	/** Where it was saved before, when it's moving (Save As). */
	previousPath?: string
	uuid: string
	settings: CollectionSettings
	/** Absolute Blueprint paths, in export order. */
	members: string[]
	/** The members as last saved. */
	previousMembers: string[]
}

/**
 * Writes the collection, links and unlinks members to match, and pushes the settings into open
 * members. Removed members' exported files stay until the next collection export.
 * @throws {CollectionError} When a new member can't join; nothing is written then.
 */
export function saveCollection(options: SaveCollectionOptions): LoadedCollection {
	const path = normalizePath(options.path)
	const previousPath = options.previousPath ? normalizePath(options.previousPath) : undefined
	const members = options.members.map(normalizePath)
	const previous = options.previousMembers.map(normalizePath)
	const moved = !!previousPath && previousPath !== path
	// A moved collection relinks every member to its new path.
	const toLink = moved ? members : members.filter(member => !previous.includes(member))
	for (const member of toLink) assertCanJoin(path, member, previousPath)

	// Link before writing the collection, so a member that can't hold its link isn't listed.
	const linked: string[] = []
	try {
		for (const member of toLink) {
			setMemberSetting(member, 'collection', relativeTo(member, path))
			linked.push(member)
		}
	} catch (e) {
		for (const member of linked) unlink([path], member)
		throw e
	}

	const collection: LoadedCollection = {
		path,
		file: {
			format_version: COLLECTION_FORMAT_VERSION,
			uuid: options.uuid,
			settings: { ...options.settings },
			blueprints: members.map(member => relativeTo(path, member)),
		},
	}
	writeCollection(collection)

	for (const member of previous) {
		if (!members.includes(member)) unlink([path, previousPath], member)
	}
	syncOpenMembers(collection)
	return collection
}

/** The collection that owns `project`'s shared settings, or undefined when the link is unset or broken. */
export function getManagingCollection(project: ModelProject) {
	try {
		return getLinkedCollection(project)
	} catch (e) {
		if (!(e instanceof CollectionError)) throw e
	}
}

/**
 * Takes `project` out of its collection, and clears its link either way. An open collection tab
 * drops it as an unsaved edit; a closed collection file is rewritten without it.
 */
export function leaveCollection(project: ModelProject) {
	const path = normalizePath(project.save_path)
	const collectionPath = getLinkedCollectionPath(project)
	const tab = collectionPath ? findOpenCollection(normalizePath(collectionPath)) : undefined
	if (tab) {
		tab.collection!.members = tab.collection!.members.filter(member => member !== path)
		tab.saved = false
	} else {
		const collection = getManagingCollection(project)
		if (collection) {
			const members = getMemberPaths(collection)
			saveCollection({
				path: collection.path,
				uuid: collection.file.uuid,
				settings: collection.file.settings,
				members: members.filter(member => member !== path),
				previousMembers: members,
			})
		}
	}
	setMemberSetting(path, 'collection', '')
}

/** The thumbnail Blockbench saved for a recently opened Blueprint, if there is one. */
export function getBlueprintThumbnail(path: string): string | undefined {
	if (!isApp) return
	const thumbnail = getThumbnailPath(PathModule.normalize(path))
	return getFsModule().existsSync(thumbnail) ? thumbnail : undefined
}

/**
 * Where Blockbench keeps the recent-projects thumbnail of the project listed under `recentPath`.
 * Blockbench hashes the path exactly as the recent list stores it.
 */
export function getThumbnailPath(recentPath: string) {
	const hash = (recentPath as any).hashCode().toString().replace(/^-/, '0')
	return PathModule.join(SystemInfo.user_data_directory, 'thumbnails', `${hash}.png`)
}
