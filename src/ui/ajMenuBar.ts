// @ts-ignore
import logo from '../assets/animated_java_icon.svg'
import * as events from '../events'
import { safeExportProject } from '../exporter'
import { ajModelFormat } from '../modelFormat'
import { createAction, createBarMenu } from '../util/moddingTools'
import { translate } from '../util/translation'
import { openAJAboutDialog } from './ajAbout'
import { openAJDocsDialog } from './ajDocs'
import { openAJProjectSettingsDialog } from './ajProjectSettings'
import { openAJSettingsDialog } from './ajSettings'

interface IAnimatedJavaMenu extends BarMenu {
	label: HTMLDivElement
}

const MENU = createBarMenu(
	'animated_java:menu',
	[],
	() => Format === ajModelFormat
) as IAnimatedJavaMenu
MENU.label.style.display = 'none'

const MENU_BAR = document.querySelector('#menu_bar')
if (MENU_BAR) MENU_BAR.appendChild(MENU.label)
else throw new Error('Animated Java failed to load: Could not find Blockbench menu bar element!')

const IMG = document.createElement('img')
MENU.label.innerHTML = translate('animated_java.menubar.settings')
IMG.src = logo
IMG.width = 16
IMG.height = 16
IMG.style.position = 'relative'
IMG.style.top = '2px'
IMG.style.borderRadius = '8px'
IMG.style.marginRight = '5px'
MENU.label.prepend(IMG)

events.SELECT_PROJECT.subscribe(() => {
	queueMicrotask(() => {
		MENU.label.style.display = Format === ajModelFormat ? 'inline-block' : 'none'
	})
})

events.UNSELECT_PROJECT.subscribe(() => {
	MENU.label.style.display = 'none'
})

MenuBar.addAction(
	createAction('animated_java:about', {
		icon: 'info',
		category: 'animated_java',
		name: translate('animated_java.menubar.items.about'),
		condition: () => Format === ajModelFormat,
		click() {
			openAJAboutDialog()
		},
	}),
	'animated_java:menu'
)

MenuBar.addAction(
	createAction('animated_java:settings', {
		icon: 'settings',
		category: 'animated_java',
		name: translate('animated_java.menubar.items.settings'),
		condition: () => Format === ajModelFormat,
		click() {
			openAJSettingsDialog()
		},
	}),
	'animated_java:menu'
)

MenuBar.addAction(
	createAction('animated_java:project_settings', {
		icon: 'settings',
		category: 'animated_java',
		name: translate('animated_java.menubar.items.project_settings'),
		condition: () => Format === ajModelFormat,
		click: function () {
			openAJProjectSettingsDialog()
		},
	}),
	'animated_java:menu'
)

MenuBar.addAction(
	createAction('animated_java:documentation', {
		icon: 'find_in_page',
		category: 'animated_java',
		name: translate('animated_java.menubar.items.documentation'),
		condition: () => Format === ajModelFormat,
		click: function () {
			openAJDocsDialog()
		},
	}),
	'animated_java:menu'
)

MenuBar.addAction(
	createAction('animated_java:export_project', {
		name: translate('animated_java.menubar.items.export_project'),
		icon: 'insert_drive_file',
		category: 'file',
		condition: () => Format === ajModelFormat,
		click: () => {
			void safeExportProject()
		},
	}),
	'animated_java:menu'
)
