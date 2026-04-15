import { registerDeletableHandlerPatch } from 'blockbench-patch-manager'
import AnimatedJavaIcon from '../assets/animated_java_icon.svg'
import { openAboutDialog } from '../dialogs/about/about'
import { openBlueprintSettingsDialog } from '../dialogs/blueprintSettings/blueprintSettings'
import { openChangelogDialog } from '../dialogs/changelog/changelog'
import { activeProjectIsBlueprintFormat, BLUEPRINT_FORMAT_ID } from '../formats/blueprint'
import { cleanupExportedFiles } from '../systems/cleaner'
import { exportProject } from '../systems/exporter'
import { translate } from '../util/translation'

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

const OPEN_ABOUT = registerDeletableHandlerPatch({
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

const OPEN_DOCUMENTATION = registerDeletableHandlerPatch({
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

const OPEN_BLUEPRINT_SETTINGS = registerDeletableHandlerPatch({
	id: 'animated_java:action/blueprint-settings',
	create() {
		return new Blockbench.Action(`animated_java:action/blueprint-settings`, {
			icon: 'settings',
			category: 'animated_java',
			name: translate('action.open_blueprint_settings.name'),
			condition: activeProjectIsBlueprintFormat,
			click() {
				openBlueprintSettingsDialog()
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

const EXPORT_DEBUG = registerDeletableHandlerPatch({
	id: 'animated_java:action/export-debug',
	create() {
		return new Blockbench.Action(`animated_java:action/export-debug`, {
			icon: 'bug_report',
			category: 'animated_java',
			name: translate('action.export_debug.name'),
			condition: activeProjectIsBlueprintFormat,
			click() {
				void exportProject({ debugMode: true })
			},
			keybind: new Keybind({ ctrl: true, key: 69 /* E */ }),
		})
	},
})

const EXPORT = registerDeletableHandlerPatch({
	id: 'animated_java:action/export',
	create() {
		return new Blockbench.Action(`animated_java:action/export`, {
			icon: 'insert_drive_file',
			category: 'animated_java',
			name: translate('action.export.name'),
			condition: activeProjectIsBlueprintFormat,
			click() {
				void exportProject()
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

		menubar.label.style.display = 'inline-block'
		menubar.label.innerHTML = translate('menubar.label')
		menubar.label.prepend(createIconImg())

		MenuBar.update()

		return menubar
	},
})
