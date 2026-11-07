import type { Zippable } from 'fflate/browser'
import { getFsModule } from '../constants'
import { openUnexpectedErrorDialog } from '../dialogs/unexpectedError/unexpectedError'
import { IntentionalExportError } from '../systems/errors'
import { exportProject } from '../systems/exporter'
import { getCollectionRigs, removeRig } from '../systems/rigRemover'
import { zip } from '../systems/util'
import { normalizePath, resolvePath } from '../util/fileUtil'
import { localize as translate } from '../util/lang'
import { findDuplicates, resolveFrom } from './collectionFile'
import {
	applyCollectionSettings,
	CollectionError,
	findOpenBlueprint,
	getBlueprintId,
	getLinkState,
	getMemberPaths,
	type LoadedCollection,
	openBlueprintFile,
} from '.'

type PackKind = 'resource_pack' | 'data_pack'

const PACKS: Array<{ kind: PackKind; mode: `${PackKind}_export_mode`; ajmeta: string }> = [
	{ kind: 'resource_pack', mode: 'resource_pack_export_mode', ajmeta: 'assets.ajmeta' },
	{ kind: 'data_pack', mode: 'data_pack_export_mode', ajmeta: 'data.ajmeta' },
]

/**
 * Checks every member can export before any of them do, so a bad member doesn't leave the
 * packs half-exported.
 * @throws {CollectionError}
 */
function validateMembers(collection: LoadedCollection, paths: string[]) {
	if (paths.length === 0) throw new CollectionError(translate('collection.error.no_members'))

	const duplicates = findDuplicates(paths)
	if (duplicates.length) {
		throw new CollectionError(translate('collection.error.duplicate_member', duplicates[0]))
	}

	const ids = new Map<string, string>()
	for (const path of paths) {
		const state = getLinkState(path)
		if (state.pluginMode) {
			throw new CollectionError(translate('collection.error.plugin_mode', path))
		}
		if (state.collection !== collection.path) {
			throw new CollectionError(translate('collection.error.not_linked', path))
		}
		const id = getBlueprintId(path)
		if (ids.has(id)) {
			throw new CollectionError(
				translate('collection.error.duplicate_blueprint_id', id, ids.get(id)!, path)
			)
		}
		ids.set(id, path)
	}
	return [...ids.keys()]
}

function resolvePackPath(collection: LoadedCollection, kind: PackKind) {
	return resolvePath(resolveFrom(collection.path, collection.file.settings[kind]))
}

/** Fresh folder-mode packs that zip-mode packs export into, to zip once every member is in. */
function createStagingFolders(collection: LoadedCollection) {
	const { mkdirSync, writeFileSync } = getFsModule()
	const staging: Partial<Record<PackKind, string>> = {}
	let root: string | undefined
	for (const { kind, mode } of PACKS) {
		if (collection.file.settings[mode] !== 'zip') continue
		root ??= PathModule.join(SystemInfo.temp_directory, `aj-collection-${guid()}`)
		const folder = PathModule.join(root, kind)
		mkdirSync(folder, { recursive: true })
		// Folder-mode validation needs a pack.mcmeta; the compilers fill in its formats.
		writeFileSync(PathModule.join(folder, 'pack.mcmeta'), '{ "pack": {} }')
		staging[kind] = folder
	}
	return { root, staging }
}

async function zipFolder(folder: string, zipPath: string) {
	const { readdirSync, readFileSync, promises } = getFsModule()
	const data: Zippable = {}
	const walk = (dir: string) => {
		for (const entry of readdirSync(dir, { withFileTypes: true })) {
			const full = PathModule.join(dir, entry.name)
			if (entry.isDirectory()) walk(full)
			else if (!entry.name.endsWith('.ajmeta')) {
				data[normalizePath(PathModule.relative(folder, full))] = Uint8Array.from(
					readFileSync(full)
				)
			}
		}
	}
	walk(folder)
	await promises.rm(zipPath, { recursive: true, force: true })
	await promises.writeFile(zipPath, await zip(data, {}))
}

const nextFrame = () => new Promise(resolve => requestAnimationFrame(resolve))

/**
 * Exports every member into the collection's packs, then removes rigs of members that left
 * the collection. Members that aren't open are opened for their export and closed after.
 * @returns Whether every member exported.
 */
export async function exportCollection(collection: LoadedCollection, debugMode = false) {
	const paths = getMemberPaths(collection)
	let blueprintIds: string[]
	try {
		blueprintIds = validateMembers(collection, paths)
	} catch (e) {
		if (!(e instanceof CollectionError)) throw e
		Blockbench.showMessageBox({
			title: translate('misc.failed_to_export.title'),
			message: e.message,
			buttons: [translate('misc.failed_to_export.button')],
		})
		return false
	}

	const selectedProject = Project
	const { root, staging } = createStagingFolders(collection)
	let success = true
	try {
		for (const path of paths) {
			const openProject = findOpenBlueprint(path)
			const project = openProject ?? openBlueprintFile(path)
			project.select()
			await nextFrame()

			applyCollectionSettings(project, collection)
			for (const { kind, mode } of PACKS) {
				if (!staging[kind]) continue
				project.animated_java[mode] = 'folder'
				project.animated_java[kind] = staging[kind]
			}

			success = await exportProject({ debugMode, collectionUuid: collection.file.uuid })
			applyCollectionSettings(project, collection)
			if (!openProject) await project.close(true)
			if (!success) return false
			await nextFrame()
		}

		for (const { kind, mode, ajmeta } of PACKS) {
			const exportMode = collection.file.settings[mode]
			if (exportMode === 'zip') {
				await zipFolder(staging[kind]!, resolvePackPath(collection, kind))
			} else if (exportMode === 'folder') {
				const ajmetaPath = PathModule.join(resolvePackPath(collection, kind), ajmeta)
				for (const id of getCollectionRigs(ajmetaPath, collection.file.uuid)) {
					if (!blueprintIds.includes(id)) await removeRig(ajmetaPath, id)
				}
			}
		}

		Blockbench.showQuickMessage(
			translate('collection.export.success', String(paths.length)),
			2000
		)
		return true
	} catch (e: any) {
		success = false
		console.error(e)
		if (e instanceof IntentionalExportError) {
			Blockbench.showMessageBox({
				title: translate('misc.failed_to_export.title'),
				message: e.message,
				buttons: [translate('misc.failed_to_export.button')],
			})
		} else {
			openUnexpectedErrorDialog(e as Error)
		}
		return false
	} finally {
		if (root) await getFsModule().promises.rm(root, { recursive: true, force: true })
		// `Project` is 0, not undefined, when no project is open.
		if (success && selectedProject && ModelProject.all.includes(selectedProject))
			selectedProject.select()
	}
}
