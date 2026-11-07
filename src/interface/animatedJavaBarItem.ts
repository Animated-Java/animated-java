import { registerDeletableHandlerPatch } from 'blockbench-patch-manager'
import AnimatedJavaIcon from '../assets/animated_java_icon.svg'
import { openAboutDialog } from '../dialogs/about/about'
import { openBlueprintSettings } from '../dialogs/blueprintSettings/blueprintSettings'
import { openChangelogDialog } from '../dialogs/changelog/changelog'
import { CollectionError, getLinkedCollection, getLinkedCollectionPath } from '../collections'
import { COLLECTION_EXTENSION } from '../collections/collectionFile'
import { exportCollection } from '../collections/exportCollection'
import { activeProjectIsBlueprintFormat, BLUEPRINT_FORMAT_ID } from '../formats/blueprint'
import {
	activeProjectIsCollectionFormat,
	COLLECTION_FORMAT,
	exportActiveCollectionTab,
	openCollection,
	saveCollectionBeforeExport,
} from '../formats/collection'
import { cleanupExportedFiles } from '../systems/cleaner'
import { exportProject } from '../systems/exporter'
import { localize as translate } from '../util/lang'

function createIconImg() {
	const img = document.createElement('img')
	Object.assign(img, {
		src: AnimatedJavaIcon,
		width: 16,
		height: 16,
	})
	Object.assign(img.style, {
		position: 'relative',
		top: '2px',
		borderRadius: '2px',
		marginRight: '6px',
		boxShadow: '1px 1px 1px #000000aa',
	})
	return img
}

const SEPARATOR_A = new MenuSeparator('animated_java:menu-separator/menubar-separator-a')
const SEPARATOR_B = new MenuSeparator('animated_java:menu-separator/menubar-separator-b')

export const OPEN_ABOUT = registerDeletableHandlerPatch({
	id: 'animated_java:action/about',
	create() {
		return new Blockbench.Action(`animated_java:action/about`, {
			icon: 'info',
			category: 'animated_java',
			name: translate('action.open_about.name'),
			click() {
				openAboutDialog()
			},
		})
	},
})

export const OPEN_DOCUMENTATION = registerDeletableHandlerPatch({
	id: 'animated_java:action/documentation',
	create() {
		return new Blockbench.Action(`animated_java:action/documentation`, {
			icon: 'find_in_page',
			category: 'animated_java',
			name: translate('action.open_documentation.name'),
			click() {
				Blockbench.openLink('https://animated-java.dev/docs')
			},
		})
	},
})

const OPEN_CHANGELOG = registerDeletableHandlerPatch({
	id: 'animated_java:action/changelog',
	create() {
		return new Blockbench.Action(`animated_java:action/changelog`, {
			icon: 'history',
			category: 'animated_java',
			name: translate('action.open_changelog.name'),
			click() {
				openChangelogDialog()
			},
		})
	},
})

function areMultipleBlueprintsOpen() {
	return Blockbench.ModelProject.all.filter(p => p.format.id === BLUEPRINT_FORMAT_ID).length > 1
}

export async function exportAll(debugMode: boolean) {
	const selectedProject = Project
	const blueprints = Blockbench.ModelProject.all.filter(p => p.format.id === BLUEPRINT_FORMAT_ID)
	let success = true
	for (const project of blueprints) {
		project.select()
		await new Promise(resolve => requestAnimationFrame(resolve))
		success = await exportProject({ debugMode })
		if (!success) break
		await new Promise(resolve => requestAnimationFrame(resolve))
	}
	if (success) selectedProject?.select()
}

const EXPORT_ALL_DEBUG = registerDeletableHandlerPatch({
	id: 'animated_java:action/export-all-debug',
	create() {
		return new Blockbench.Action(`animated_java:action/export-all-debug`, {
			icon: 'bug_report',
			category: 'animated_java',
			name: translate('action.export_all_debug.name'),
			description: translate('action.export_all_debug.description'),
			condition: areMultipleBlueprintsOpen,
			click() {
				console.log('Exporting all open Blueprints in development mode...')
				void exportAll(true)
			},
		})
	},
})

const EXPORT_ALL = registerDeletableHandlerPatch({
	id: 'animated_java:action/export-all',
	create() {
		return new Blockbench.Action(`animated_java:action/export-all`, {
			icon: 'insert_drive_file',
			category: 'animated_java',
			name: translate('action.export_all.name'),
			description: translate('action.export_all.description'),
			condition: areMultipleBlueprintsOpen,
			click() {
				console.log('Exporting all open Blueprints...')
				void exportAll(false)
			},
		})
	},
})

function showCollectionError(e: unknown) {
	if (!(e instanceof CollectionError)) throw e
	Blockbench.showMessageBox({
		title: translate('collection.error.title'),
		message: e.message,
		buttons: [tl('dialog.ok')],
	})
}

function projectHasCollection() {
	return activeProjectIsBlueprintFormat() && !!Project && !!getLinkedCollectionPath(Project)
}

/** Opens the collection's tab, closing any dialog it was opened from. */
export function openCollectionFile(path: string) {
	Dialog.open?.close()
	openCollection(path)
}

/** Exports the collection the active Blueprint belongs to, saving its open tab first. */
export async function exportActiveCollection(debugMode: boolean) {
	try {
		const path = getLinkedCollectionPath(Project!)
		if (!path || !saveCollectionBeforeExport(path)) return
		const collection = getLinkedCollection(Project!)
		if (collection) await exportCollection(collection, debugMode)
	} catch (e) {
		showCollectionError(e)
	}
}

const NEW_COLLECTION = registerDeletableHandlerPatch({
	id: 'animated_java:action/new-collection',
	create() {
		return new Blockbench.Action(`animated_java:action/new-collection`, {
			icon: 'library_add',
			category: 'animated_java',
			name: translate('action.new_collection.name'),
			description: translate('action.new_collection.description'),
			condition: () => isApp,
			click() {
				newProject(COLLECTION_FORMAT.get()!)
			},
		})
	},
})

const OPEN_COLLECTION = registerDeletableHandlerPatch({
	id: 'animated_java:action/open-collection',
	create() {
		return new Blockbench.Action(`animated_java:action/open-collection`, {
			icon: 'collections_bookmark',
			category: 'animated_java',
			name: translate('action.open_collection.name'),
			description: translate('action.open_collection.description'),
			condition: () => isApp,
			click() {
				Blockbench.import(
					{
						resource_id: 'animated_java:collection',
						type: translate('collection.file_type'),
						extensions: [COLLECTION_EXTENSION],
						readtype: 'none',
						multiple: false,
					},
					files => {
						if (files[0]) openCollection(files[0].path)
					}
				)
			},
		})
	},
})

const EXPORT_COLLECTION_DEBUG = registerDeletableHandlerPatch({
	id: 'animated_java:action/export-collection-debug',
	create() {
		return new Blockbench.Action(`animated_java:action/export-collection-debug`, {
			icon: 'bug_report',
			category: 'animated_java',
			name: translate('action.export_collection_debug.name'),
			description: translate('action.export_collection_debug.description'),
			condition: projectHasCollection,
			click() {
				void exportActiveCollection(true)
			},
		})
	},
})

const EXPORT_COLLECTION = registerDeletableHandlerPatch({
	id: 'animated_java:action/export-collection',
	create() {
		return new Blockbench.Action(`animated_java:action/export-collection`, {
			icon: 'insert_drive_file',
			category: 'animated_java',
			name: translate('action.export_collection.name'),
			description: translate('action.export_collection.description'),
			condition: projectHasCollection,
			click() {
				void exportActiveCollection(false)
			},
		})
	},
})

const OPEN_BLUEPRINT_SETTINGS = registerDeletableHandlerPatch({
	id: 'animated_java:action/blueprint-settings',
	create() {
		return new Blockbench.Action(`animated_java:action/blueprint-settings`, {
			icon: 'settings',
			category: 'animated_java',
			name: translate('action.open_blueprint_settings.name'),
			condition: activeProjectIsBlueprintFormat,
			click() {
				openBlueprintSettings()
			},
		})
	},
})

const EXTRACT = registerDeletableHandlerPatch({
	id: 'animated_java:action/extract',
	create() {
		return new Blockbench.Action(`animated_java:action/extract`, {
			icon: 'fa-trash-can',
			category: 'animated_java',
			name: translate('action.extract.confirm'),
			condition: activeProjectIsBlueprintFormat,
			click() {
				void cleanupExportedFiles()
			},
		})
	},
})

export const EXPORT_DEBUG = registerDeletableHandlerPatch({
	id: 'animated_java:action/export-debug',
	create() {
		return new Blockbench.Action(`animated_java:action/export-debug`, {
			icon: 'bug_report',
			category: 'animated_java',
			name: translate('action.export_debug.name'),
			condition: () => activeProjectIsBlueprintFormat() || activeProjectIsCollectionFormat(),
			click() {
				if (activeProjectIsCollectionFormat()) void exportActiveCollectionTab(true)
				else void exportProject({ debugMode: true })
			},
			keybind: new Keybind({ ctrl: true, key: 69 /* E */ }),
		})
	},
})

export const EXPORT = registerDeletableHandlerPatch({
	id: 'animated_java:action/export',
	create() {
		return new Blockbench.Action(`animated_java:action/export`, {
			icon: 'insert_drive_file',
			category: 'animated_java',
			name: translate('action.export.name'),
			condition: () => activeProjectIsBlueprintFormat() || activeProjectIsCollectionFormat(),
			click() {
				if (activeProjectIsCollectionFormat()) void exportActiveCollectionTab(false)
				else void exportProject()
			},
			keybind: new Keybind({ ctrl: true, shift: true, key: 69 /* E */ }),
		})
	},
})

registerDeletableHandlerPatch({
	id: 'animated_java:menubar/main',
	dependencies: [
		`animated_java:action/about`,
		`animated_java:action/documentation`,
		`animated_java:action/changelog`,
		`animated_java:action/export-all-debug`,
		`animated_java:action/export-all`,
		`animated_java:action/new-collection`,
		`animated_java:action/open-collection`,
		`animated_java:action/export-collection-debug`,
		`animated_java:action/export-collection`,
		`animated_java:action/blueprint-settings`,
		`animated_java:action/extract`,
		`animated_java:action/export-debug`,
		`animated_java:action/export`,
	],
	create() {
		const menubar = new Blockbench.BarMenu(
			`animated_java:menubar/main`,
			[
				OPEN_ABOUT.get()!,
				OPEN_DOCUMENTATION.get()!,
				OPEN_CHANGELOG.get()!,
				SEPARATOR_A,
				EXPORT_ALL_DEBUG.get()!,
				EXPORT_ALL.get()!,
				{
					id: 'animated_java:submenu/collection',
					name: translate('action.collection_menu.name'),
					icon: 'collections_bookmark',
					searchable: false,
					children: [
						NEW_COLLECTION.get()!,
						OPEN_COLLECTION.get()!,
						'_',
						EXPORT_COLLECTION_DEBUG.get()!,
						EXPORT_COLLECTION.get()!,
					],
					condition: () => isApp,
				},
				SEPARATOR_B,
				OPEN_BLUEPRINT_SETTINGS.get()!,
				{
					id: 'animated_java:submenu/extract',
					name: translate('action.extract.name'),
					icon: 'fa-trash-can',
					searchable: false,
					children: [EXTRACT.get()],
					condition: activeProjectIsBlueprintFormat,
				},
				EXPORT_DEBUG.get()!,
				EXPORT.get()!,
			],
			{}
		)

		// @ts-expect-error
		menubar.label.style.display = 'inline-block'
		// @ts-expect-error
		menubar.label.innerHTML = translate('menubar.label')
		// @ts-expect-error
		menubar.label.prepend(createIconImg())

		MenuBar.update()

		return menubar
	},
})
