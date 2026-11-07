import { registerDeletableHandlerPatch } from 'blockbench-patch-manager'
import { mount, unmount } from 'svelte'
import {
	assertCanJoin,
	COLLECTION_FORMAT_ID,
	CollectionError,
	type CollectionProjectState,
	collectionFromProject,
	findOpenBlueprint,
	findOpenCollection,
	getCollectionDefaults,
	openBlueprintFile,
	saveCollection,
	setBlueprintId,
} from '../../collections'
import {
	COLLECTION_EXTENSION,
	CollectionParseError,
	parseCollection,
	resolveMemberPaths,
	serializeCollection,
} from '../../collections/collectionFile'
import { exportCollection } from '../../collections/exportCollection'
import { getFsModule } from '../../constants'
import { SveltePanel } from 'svelte-patching-tools/blockbench'
import EVENTS from '../../util/events'
import { normalizePath } from '../../util/fileUtil'
import { localize as translate } from '../../util/lang'
import CollectionPage from './collectionPage.svelte'
import SettingsPanel from './settingsPanel.svelte'
import { updateCollectionThumbnail } from './thumbnail'

export const COLLECTION_MODE_ID = 'animated_java:collection'
const TOOL_ID = 'animated_java:collection_tool'
const TOOLBAR_ID = 'animated_java:collection_toolbar'
const ICON = 'collections_bookmark'

export function activeProjectIsCollectionFormat() {
	return Project instanceof Blockbench.ModelProject && Project.format.id === COLLECTION_FORMAT_ID
}

function showError(e: unknown) {
	if (!(e instanceof CollectionError || e instanceof CollectionParseError)) throw e
	Blockbench.showMessageBox({
		title: translate('collection.error.title'),
		message: e.message,
		buttons: [tl('dialog.ok')],
	})
}

/** Applies an edit to a collection tab, marks it unsaved and tells its views to re-read it. */
export function editCollection(
	project: ModelProject,
	edit: (state: CollectionProjectState) => void
) {
	edit(project.collection!)
	project.saved = false
	EVENTS.UPDATE_COLLECTION.publish(project)
}

function pickBlueprints(multiple: boolean, onPick: (paths: string[]) => void) {
	Blockbench.import(
		{
			type: 'Blueprint',
			extensions: ['ajblueprint'],
			readtype: 'none',
			multiple,
			resource_id: 'animated_java:collection.add_blueprint',
		},
		files => onPick(files.map(file => normalizePath(file.path)))
	)
}

/** Whether the Blueprint at `path` can join the collection open in `project`, saying why not. */
function canJoin(project: ModelProject, path: string) {
	if (project.collection!.members.includes(path)) {
		Blockbench.showQuickMessage(
			translate('collection.page.already_member', pathToName(path, true))
		)
		return false
	}
	try {
		assertCanJoin(normalizePath(project.save_path), path)
		return true
	} catch (e) {
		showError(e)
		return false
	}
}

export function addBlueprintsToCollection(project: ModelProject) {
	pickBlueprints(true, paths => {
		const added: string[] = []
		for (const path of paths) {
			if (!added.includes(path) && canJoin(project, path)) added.push(path)
		}
		if (added.length) editCollection(project, state => state.members.push(...added))
	})
}

/** Points a member whose file went missing at the file's new location. */
export function locateMember(project: ModelProject, index: number) {
	pickBlueprints(false, ([path]) => {
		if (!path || !canJoin(project, path)) return
		editCollection(project, state => (state.members[index] = path))
	})
}

export function removeMember(project: ModelProject, index: number) {
	editCollection(project, state => state.members.splice(index, 1))
}

/** Sets the export order. `paths` must hold the same members, reordered. */
export function reorderMembers(project: ModelProject, paths: string[]) {
	const current = project.collection!.members
	if (paths.length !== current.length || paths.every((path, i) => path === current[i])) return
	editCollection(project, state => (state.members = [...paths]))
}

/**
 * Writes a member's new Blueprint ID straight to its file. The collection itself doesn't change.
 * @returns Whether it changed.
 */
export function changeMemberBlueprintId(project: ModelProject, path: string, id: string) {
	try {
		setBlueprintId(path, id)
	} catch (e) {
		showError(e)
		return false
	}
	EVENTS.UPDATE_COLLECTION.publish(project)
	return true
}

/** Switches to the member's tab, opening it first when it isn't open. */
export function openMember(path: string) {
	const open = findOpenBlueprint(path)
	if (open) open.select()
	else openBlueprintFile(path)
}

/**
 * Saves a collection tab to `path`, linking and unlinking members to match.
 * @returns Whether it saved.
 */
export function saveCollectionProject(project: ModelProject, path: string) {
	const state = project.collection!
	try {
		saveCollection({
			path,
			previousPath: project.save_path || undefined,
			uuid: state.uuid,
			settings: state.settings,
			members: state.members,
			previousMembers: state.savedMembers,
		})
	} catch (e) {
		showError(e)
		return false
	}
	state.savedMembers = [...state.members]
	project.save_path = normalizePath(path)
	project.name = pathToName(path, false)
	project.saved = true
	addRecentProject({ name: pathToName(path, true), path, icon: ICON })
	void updateCollectionThumbnail(path, state.members)
	Blockbench.showQuickMessage(tl('message.save_file', [pathToName(path, true)]))
	return true
}

/** Saves the active collection tab, asking where for one that's never been saved. */
export function saveActiveCollection(saveAs = false) {
	const codec = COLLECTION_CODEC.get()!
	if (Project!.save_path && !saveAs) codec.write!(codec.compile!(), Project!.save_path)
	else codec.export!()
}

/**
 * Saves the collection's tab first when it has unsaved changes, so an export never runs against
 * member links that aren't written yet.
 * @returns Whether the export can go ahead.
 */
export function saveCollectionBeforeExport(path: string) {
	const tab = findOpenCollection(normalizePath(path))
	if (!tab || tab.saved) return true
	return saveCollectionProject(tab, tab.save_path)
}

/** Exports the active collection tab, saving it first. */
export async function exportActiveCollectionTab(debugMode: boolean) {
	const project = Project!
	if (!project.save_path) {
		Blockbench.showMessageBox(
			{
				title: translate('collection.error.title'),
				message: translate('collection.error.save_before_export'),
				buttons: [tl('dialog.save'), tl('dialog.cancel')],
				confirm: 0,
				cancel: 1,
			},
			button => {
				if (button === 0) saveActiveCollection()
			}
		)
		return false
	}
	if (!project.saved && !saveCollectionProject(project, project.save_path)) return false
	return exportCollection(collectionFromProject(project), debugMode)
}

function setupCollectionProject(path: string, model: unknown) {
	let state: CollectionProjectState
	try {
		const file = parseCollection(model, getCollectionDefaults())
		const members = resolveMemberPaths(file, path)
		state = { uuid: file.uuid, settings: file.settings, members, savedMembers: [...members] }
	} catch (e) {
		showError(e)
		return
	}
	newProject(COLLECTION_FORMAT.get()!)
	Project!.collection = state
	Project!.save_path = normalizePath(path)
	Project!.name = pathToName(path, false)
	Project!.saved = true
	addRecentProject({ name: pathToName(path, true), path, icon: ICON })
	void updateCollectionThumbnail(path, state.members)
	// onSetup selected the mode before the loaded state was in place.
	Modes.options[COLLECTION_MODE_ID].select()
	EVENTS.UPDATE_COLLECTION.publish(Project!)
}

/** Opens the collection at `path` in a tab, or switches to its tab when it's already open. */
export function openCollection(path: string) {
	const open = findOpenCollection(normalizePath(path))
	if (open) return open.select()
	const { existsSync, readFileSync } = getFsModule()
	if (!existsSync(path)) {
		return showError(new CollectionError(translate('collection.error.missing_file', path)))
	}
	let model: unknown
	try {
		model = JSON.parse(readFileSync(path, 'utf-8'))
	} catch (e: any) {
		return showError(
			new CollectionError(translate('collection.error.invalid_file', path, e.message))
		)
	}
	setupCollectionProject(path, model)
}

export const COLLECTION_CODEC = registerDeletableHandlerPatch({
	id: 'animated_java:codec/collection',
	create() {
		return new Blockbench.Codec('animated_java:codec/collection', {
			name: translate('collection.file_type'),
			extension: COLLECTION_EXTENSION,
			remember: true,
			load_filter: { extensions: [COLLECTION_EXTENSION], type: 'json' },

			load(model, file) {
				setupCollectionProject(file.path, model)
			},

			compile() {
				return serializeCollection(collectionFromProject(Project!).file)
			},

			write(_content, path) {
				saveCollectionProject(Project!, path)
			},

			export() {
				Blockbench.export({
					resource_id: 'animated_java:collection',
					type: translate('collection.file_type'),
					extensions: [COLLECTION_EXTENSION],
					name: Project!.name || 'collection',
					startpath: Project!.save_path,
					content: '',
					// eslint-disable-next-line @typescript-eslint/naming-convention
					custom_writer: (_content: unknown, path: string) => {
						saveCollectionProject(Project!, path)
					},
				})
			},

			fileName() {
				return `${Project?.name || 'collection'}.${COLLECTION_EXTENSION}`
			},
		})
	},
})

export const COLLECTION_FORMAT = registerDeletableHandlerPatch({
	id: 'animated_java:format/collection',
	dependencies: ['animated_java:codec/collection'],
	create() {
		const format = new Blockbench.ModelFormat(COLLECTION_FORMAT_ID, {
			id: COLLECTION_FORMAT_ID,
			name: translate('collection.file_type'),
			description: translate('collection.format_description'),
			icon: ICON,
			category: 'animated_java',
			target: 'Minecraft: Java Edition',
			show_on_start_screen: true,
			edit_mode: false,
			paint_mode: false,
			animation_mode: false,
			display_mode: false,
			pose_mode: false,

			onSetup(project, newModel) {
				project.mode = COLLECTION_MODE_ID
				if (newModel) {
					project.collection = {
						uuid: guid(),
						settings: getCollectionDefaults(),
						members: [],
						savedMembers: [],
					}
				}
				Modes.options[COLLECTION_MODE_ID]?.select()
				EVENTS.UPDATE_COLLECTION.publish(project)
			},
		})

		const codec = COLLECTION_CODEC.get()!
		codec.format = format
		format.codec = codec
		return format
	},
})

const CSS = `
body:not([mode="${COLLECTION_MODE_ID}"]) #mode_screen_animated_java\\:collection {
	display: none;
}
body[mode="${COLLECTION_MODE_ID}"] #center > #preview,
body[mode="${COLLECTION_MODE_ID}"] #center > #top_slot,
body[mode="${COLLECTION_MODE_ID}"] #center > #bottom_slot {
	display: none;
}
#mode_screen_animated_java\\:collection {
	flex-grow: 1;
	min-height: 0;
	display: flex;
	flex-direction: column;
}
`

const ADD_BLUEPRINTS = registerDeletableHandlerPatch({
	id: 'animated_java:action/add-collection-blueprints',
	create() {
		return new Blockbench.Action('animated_java:action/add-collection-blueprints', {
			icon: 'library_add',
			category: 'animated_java',
			name: translate('collection.page.members.add'),
			condition: activeProjectIsCollectionFormat,
			click() {
				addBlueprintsToCollection(Project!)
			},
		})
	},
})

/**
 * The mode's only tool. Selecting it shows the collection toolbar in the tool options row, the
 * way other modes show their tools' settings there.
 */
registerDeletableHandlerPatch({
	id: 'animated_java:tool/collection',
	dependencies: [
		'animated_java:action/add-collection-blueprints',
		'animated_java:action/export-debug',
		'animated_java:action/export',
	],
	create() {
		new Toolbar(TOOLBAR_ID, {
			children: [
				ADD_BLUEPRINTS.get()!,
				'_',
				'animated_java:action/export-debug',
				'animated_java:action/export',
			],
			no_wrap: true,
		})
		const tool = new Tool(TOOL_ID, {
			icon: ICON,
			category: 'animated_java',
			name: translate('collection.mode'),
			toolbar: TOOLBAR_ID,
			selectElements: false,
			condition: () => Modes.id === COLLECTION_MODE_ID,
		})
		return {
			delete() {
				tool.delete()
				delete Toolbars[TOOLBAR_ID]
			},
		}
	},
})

registerDeletableHandlerPatch({
	id: 'animated_java:panel/collection-settings',
	create() {
		return new SveltePanel({
			id: 'animated_java:collection-settings',
			name: translate('collection.page.settings.title'),
			icon: ICON,
			expand_button: false,
			default_side: 'left',
			default_position: {
				slot: 'left_bar',
				float_position: [0, 0],
				float_size: [300, 400],
				height: 400,
				folded: false,
			},
			condition: { modes: [COLLECTION_MODE_ID] },
			component: SettingsPanel,
			props: {},
		})
	},
})

registerDeletableHandlerPatch({
	id: 'animated_java:mode/collection',
	dependencies: ['animated_java:format/collection', 'animated_java:tool/collection'],
	create() {
		let page: ReturnType<typeof mount> | undefined
		const style = Blockbench.addCSS(CSS)
		const mode = new Mode(COLLECTION_MODE_ID, {
			name: translate('collection.mode'),
			icon: ICON,
			category: 'navigate',
			default_tool: TOOL_ID,
			hide_status_bar: true,
			selectElements: false,
			condition: () => Format?.id === COLLECTION_FORMAT_ID,
			component: { template: '<div style="display: contents"></div>' },
			onSelect() {
				if (!Project?.collection) return
				const target = document.getElementById(`mode_screen_${COLLECTION_MODE_ID}`)!
				page = mount(CollectionPage, { target, props: { project: Project } })
			},
			onUnselect() {
				if (page) void unmount(page)
				page = undefined
			},
		})
		return {
			delete() {
				if (page) void unmount(page)
				mode.delete()
				style.delete()
			},
		}
	},
})
