// @ts-ignore
import AnimatedJavaIcon from '../assets/animated_java_icon.svg'
import { BLUEPRINT_FORMAT } from '../blueprintFormat'
import { PACKAGE } from '../constants'
import { compileDataPack } from '../systems/datapackCompiler'
import { events } from '../util/events'
import { createAction, createBarMenu } from '../util/moddingTools'
import { translate } from '../util/translation'
import { openBlueprintSettingsDialog } from './projectSettingsDialog'

function createIconImg() {
	const IMG = document.createElement('img')
	Object.assign(IMG, {
		src: AnimatedJavaIcon,
		width: 16,
		height: 16,
	})
	Object.assign(IMG.style, {
		position: 'relative',
		top: '2px',
		borderRadius: '8px',
		marginRight: '6px',
	})
	return IMG
}
const BLOCKBENCH_MENU_BAR = document.querySelector('#menu_bar') as HTMLDivElement
export const MENU = createBarMenu(
	`${PACKAGE.name}:menu`,
	[],
	() => Format === BLUEPRINT_FORMAT
) as BarMenu & { label: HTMLDivElement }
MENU.label.style.display = 'none'
MENU.label.innerHTML = 'Animated Java'
MENU.label.prepend(createIconImg())
BLOCKBENCH_MENU_BAR.appendChild(MENU.label)

events.SELECT_PROJECT.subscribe(project => {
	MENU.label.style.display = project.format === BLUEPRINT_FORMAT ? 'inline-block' : 'none'
})

MenuBar.addAction(
	createAction(`${PACKAGE.name}:about`, {
		icon: 'info',
		category: 'animated_java',
		name: translate('action.open_about.name'),
		condition() {
			return Format === BLUEPRINT_FORMAT
		},
		click() {
			console.log('About')
		},
	}),
	MENU.id
)

// MenuBar.addAction(
// 	createAction(`${PACKAGE.name}:settings`, {
// 		icon: 'settings',
// 		category: 'animated_java',
// 		name: 'Settings',
// 		condition() {
// 			return Format === BLUEPRINT_FORMAT
// 		},
// 		click() {
// 			console.log('Settings')
// 		},
// 	}),
// 	MENU.id
// )

MenuBar.addAction(
	createAction(`${PACKAGE.name}:blueprint_settings`, {
		icon: 'settings',
		category: 'animated_java',
		name: translate('action.open_blueprint_settings.name'),
		condition() {
			return Format === BLUEPRINT_FORMAT
		},
		click() {
			console.log('Blueprint Settings')
			openBlueprintSettingsDialog()
		},
	}),
	MENU.id
)

MenuBar.addAction(
	createAction(`${PACKAGE.name}:documentation`, {
		icon: 'find_in_page',
		category: 'animated_java',
		name: translate('action.open_documentation.name'),
		condition() {
			return Format === BLUEPRINT_FORMAT
		},
		click() {
			Blockbench.openLink('https://animated-java.dev/docs/home')
		},
	}),
	MENU.id
)

MenuBar.addAction(
	createAction(`${PACKAGE.name}:export`, {
		icon: 'insert_drive_file',
		category: 'animated_java',
		name: translate('action.export.name'),
		condition() {
			return Format === BLUEPRINT_FORMAT && !Project?.animated_java.enable_plugin_mode
		},
		click() {
			console.log('Export')
			compileDataPack()
		},
	}),
	MENU.id
)
