import { registerAction, registerBarMenu } from 'src/util/moddingTools'
import { pollUntilResult } from 'src/util/promises'
import AnimatedJavaIcon from '../assets/animated_java_icon.svg'
import { activeProjectIsBlueprintFormat, BLUEPRINT_FORMAT_ID } from '../formats/blueprint'
import { cleanupExportedFiles } from '../systems/cleaner'
import { exportProject } from '../systems/exporter'
import { translate } from '../util/translation'
import { openChangelogDialog } from './changelogDialog'
import { openAboutDialog } from './dialog/about'
import { openBlueprintSettingsDialog } from './dialog/blueprintSettings'

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

const SEPARATOR_A = new MenuSeparator('animated-java:menu-separator/menubar-separator-a')
const SEPARATOR_B = new MenuSeparator('animated-java:menu-separator/menubar-separator-b')

const OPEN_ABOUT = registerAction(
	{ id: 'animated-java:action/about' },
	{
		icon: 'info',
		category: 'animated_java',
		name: translate('action.open_about.name'),
		click() {
			openAboutDialog()
		},
	}
)

const OPEN_DOCUMENTATION = registerAction(
	{ id: 'animated-java:action/documentation' },
	{
		icon: 'find_in_page',
		category: 'animated_java',
		name: translate('action.open_documentation.name'),
		click() {
			Blockbench.openLink('https://animated-java.dev/docs')
		},
	}
)

const OPEN_CHANGELOG = registerAction(
	{ id: 'animated-java:action/changelog' },
	{
		icon: 'history',
		category: 'animated_java',
		name: translate('action.open_changelog.name'),
		click() {
			openChangelogDialog()
		},
	}
)

function areMultipleBlueprintsOpen() {
	return Blockbench.ModelProject.all.filter(p => p.format.id === BLUEPRINT_FORMAT_ID).length > 1
}

async function exportAll(debugMode: boolean) {
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

const EXPORT_ALL_DEBUG = registerAction(
	{ id: 'animated-java:action/export-all-debug' },
	{
		icon: 'bug_report',
		category: 'animated_java',
		name: translate('action.export_all_debug.name'),
		description: translate('action.export_all_debug.description'),
		condition: areMultipleBlueprintsOpen,
		click() {
			console.log('Exporting all open Blueprints in development mode...')
			void exportAll(true)
		},
	}
)

const EXPORT_ALL = registerAction(
	{ id: 'animated-java:action/export-all' },
	{
		icon: 'insert_drive_file',
		category: 'animated_java',
		name: translate('action.export_all.name'),
		description: translate('action.export_all.description'),
		condition: areMultipleBlueprintsOpen,
		click() {
			console.log('Exporting all open Blueprints...')
			void exportAll(false)
		},
	}
)

const OPEN_BLUEPRINT_SETTINGS = registerAction(
	{ id: 'animated-java:action/blueprint-settings' },
	{
		icon: 'settings',
		category: 'animated_java',
		name: translate('action.open_blueprint_settings.name'),
		condition: activeProjectIsBlueprintFormat,
		click() {
			openBlueprintSettingsDialog()
		},
	}
)

const EXTRACT = registerAction(
	{ id: 'animated-java:action/extract' },
	{
		icon: 'fa-trash-can',
		category: 'animated_java',
		name: translate('action.extract.confirm'),
		condition: activeProjectIsBlueprintFormat,
		click() {
			void cleanupExportedFiles()
		},
	}
)

const EXPORT_DEBUG = registerAction(
	{ id: 'animated-java:action/export-debug' },
	{
		icon: 'bug_report',
		category: 'animated_java',
		name: translate('action.export_debug.name'),
		condition: activeProjectIsBlueprintFormat,
		click() {
			void exportProject({ debugMode: true })
		},
		keybind: new Keybind({ ctrl: true, key: 69 /* E */ }),
	}
)

const EXPORT = registerAction(
	{ id: 'animated-java:action/export' },
	{
		icon: 'insert_drive_file',
		category: 'animated_java',
		name: translate('action.export.name'),
		condition: activeProjectIsBlueprintFormat,
		click() {
			void exportProject()
		},
		keybind: new Keybind({ ctrl: true, shift: true, key: 69 /* E */ }),
	}
)

function createExtractSubMenu() {
	if (EXTRACT.get() == undefined) return
	return {
		id: 'animated_java:submenu/extract',
		name: translate('action.extract.name'),
		icon: 'fa-trash-can',
		searchable: false,
		children: [EXTRACT.get()],
		condition: activeProjectIsBlueprintFormat,
	}
}

const MENUBAR = registerBarMenu({ id: 'animated-java:menubar/main' }, [])

MENUBAR.onCreated(menubar => {
	menubar.label.style.display = 'inline-block'
	menubar.label.innerHTML = translate('menubar.label')
	menubar.label.prepend(createIconImg())

	MenuBar.update()

	void pollUntilResult(
		() => {
			const items = [
				OPEN_ABOUT.get(),
				OPEN_DOCUMENTATION.get(),
				OPEN_CHANGELOG.get(),
				SEPARATOR_A,
				EXPORT_ALL_DEBUG.get(),
				EXPORT_ALL.get(),
				SEPARATOR_B,
				OPEN_BLUEPRINT_SETTINGS.get(),
				createExtractSubMenu(),
				EXPORT_DEBUG.get(),
				EXPORT.get(),
			]

			if (items.every(i => i != undefined)) {
				return items
			}
		},
		// Stop polling if the menu is removed
		() => !MENUBAR.get()
	).then(items => {
		for (const item of items) {
			if (!(item instanceof Action)) continue
			// Initialize each action
			menubar.addAction(item)
		}
		// Overwrite structure
		menubar.structure = items
	})
})
