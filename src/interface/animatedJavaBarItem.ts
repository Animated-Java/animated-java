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

const SEPARATOR = new MenuSeparator('animated-java:menu-separator/menubar-separator')

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

const EXPORT_DEV = registerAction(
	{ id: 'animated-java:action/export-dev' },
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
				SEPARATOR,
				OPEN_BLUEPRINT_SETTINGS.get(),
				createExtractSubMenu(),
				EXPORT_DEV.get(),
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
