import { cleanupExportedFiles } from '@aj/systems/cleaner'
import { exportProject } from '@aj/systems/exporter'
import AnimatedJavaIcon from '@assets/icons/animated_java_icon.svg'
import { BLUEPRINT_FORMAT } from '../blockbench-additions/model-formats/ajblueprint'
import { PACKAGE } from '../constants'
import { createAction, createBarMenu } from '../util/moddingTools'
import { translate } from '../util/translation'
import { openAboutDialog } from './dialogs/about'
import { openBlueprintSettingsDialog } from './dialogs/blueprint-settings'
import { openChangelogDialog } from './dialogs/changelog'

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
const MENU_ID = `${PACKAGE.name}:menu` as `animated_java:menu`
const BLOCKBENCH_MENU_BAR = document.querySelector('#menu_bar')!
export const MENU = createBarMenu(MENU_ID, [], () => Format === BLUEPRINT_FORMAT) as BarMenu & {
	label: HTMLDivElement
}
MENU.label.style.display = 'inline-block'
MENU.label.innerHTML = 'Animated Java'
MENU.label.prepend(createIconImg())
BLOCKBENCH_MENU_BAR.appendChild(MENU.label)

export const OPEN_ABOUT_ACTION = createAction(`${PACKAGE.name}:about`, {
	icon: 'info',
	category: 'animated_java',
	name: translate('action.open_about.name'),
	click() {
		openAboutDialog()
	},
	menu_path: MENU.id,
})

export const OPEN_DOCUMENTATION_ACTION = createAction(`${PACKAGE.name}:documentation`, {
	icon: 'find_in_page',
	category: 'animated_java',
	name: translate('action.open_documentation.name'),
	click() {
		Blockbench.openLink('https://animated-java.dev/docs')
	},
	menu_path: MENU.id,
})

export const OPEN_CHANGELOG_ACTION = createAction(`${PACKAGE.name}:changelog`, {
	icon: 'history',
	category: 'animated_java',
	name: translate('action.open_changelog.name'),
	click() {
		openChangelogDialog()
	},
	menu_path: MENU.id,
})

MENU.structure.push(new MenuSeparator())

export const OPEN_BLUEPRINT_SETTINGS_ACTION = createAction(`${PACKAGE.name}:blueprint_settings`, {
	icon: 'settings',
	category: 'animated_java',
	name: translate('action.open_blueprint_settings.name'),
	condition() {
		return Format === BLUEPRINT_FORMAT
	},
	click() {
		openBlueprintSettingsDialog()
	},
	menu_path: MENU.id,
})

MenuBar.menus[MENU_ID].structure.push({
	id: `${PACKAGE.name}:extract-open`,
	name: translate('action.extract.name'),
	icon: 'fa-trash-can',
	searchable: false,
	children: [],
	condition() {
		return Format === BLUEPRINT_FORMAT
	},
})

export const EXTRACT_ACTION = createAction(`${PACKAGE.name}:extract`, {
	icon: 'fa-trash-can',
	category: `${PACKAGE.name}`,
	name: translate('action.extract.confirm'),
	condition() {
		return Format === BLUEPRINT_FORMAT
	},
	click() {
		void cleanupExportedFiles()
	},
	menu_path: MENU_ID + `.${PACKAGE.name}:extract-open`,
})

export const EXPORT_ACTION = createAction(`${PACKAGE.name}:export`, {
	icon: 'insert_drive_file',
	category: 'animated_java',
	name: translate('action.export.name'),
	condition() {
		return Format === BLUEPRINT_FORMAT
	},
	click() {
		void exportProject()
	},
	menu_path: MENU.id,
})
