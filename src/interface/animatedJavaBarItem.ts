import AnimatedJavaIcon from '../assets/animated_java_icon.svg'
import { BLUEPRINT_FORMAT } from '../blueprintFormat'
import { PACKAGE } from '../constants'
import { exportProject } from '../systems/exporter'
import { events } from '../util/events'
import { createAction, createBarMenu } from '../util/moddingTools'
import { translate } from '../util/translation'
import { openAboutDialog } from './aboutDialog'
import { openBlueprintSettingsDialog } from './blueprintSettingsDialog'

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
		borderRadius: '2px',
		marginRight: '6px',
		boxShadow: '1px 1px 1px #000000aa',
	})
	return IMG
}
const BLOCKBENCH_MENU_BAR = document.querySelector('#menu_bar') as HTMLDivElement
export const MENU = createBarMenu(
	`${PACKAGE.name}:menu`,
	[],
	() => Format === BLUEPRINT_FORMAT
) as BarMenu & { label: HTMLDivElement }
MENU.label.style.display = 'inline-block'
MENU.label.innerHTML = 'Animated Java'
MENU.label.prepend(createIconImg())
BLOCKBENCH_MENU_BAR.appendChild(MENU.label)

MenuBar.addAction(
	createAction(`${PACKAGE.name}:about`, {
		icon: 'info',
		category: 'animated_java',
		name: translate('action.open_about.name'),
		click() {
			openAboutDialog()
		},
	}),
	MENU.id
)

MenuBar.addAction(
	createAction(`${PACKAGE.name}:documentation`, {
		icon: 'find_in_page',
		category: 'animated_java',
		name: translate('action.open_documentation.name'),
		click() {
			Blockbench.openLink('https://animated-java.dev/docs')
		},
	}),
	MENU.id
)

MenuBar.addAction(
	createAction(`${PACKAGE.name}:blueprint_settings`, {
		icon: 'settings',
		category: 'animated_java',
		name: translate('action.open_blueprint_settings.name'),
		condition() {
			return Format === BLUEPRINT_FORMAT
		},
		click() {
			openBlueprintSettingsDialog()
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
			return Format === BLUEPRINT_FORMAT
		},
		click() {
			void exportProject()
		},
	}),
	MENU.id
)
