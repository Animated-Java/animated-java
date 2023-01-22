import { ajModelFormat } from '../modelFormat'
import { translate } from '../translation'
import { ajAction } from '../util/ajAction'
import { AJDialog } from './ajDialog'
import * as Settings from './settings.svelte'

function openSettingsDialog() {
	const SettingsDialog = new AJDialog({
		// @ts-ignore
		svelteComponent: Settings,
		title: 'Animated Java: Settings',
		id: 'animatedJava.settings',
	}).show()
}

const SettingsMenu: any = new BarMenu('animatedJava', [], () => Format.id === ajModelFormat.id)
SettingsMenu.label.innerHtml = translate('animatedJava.ui.mainMenu')

MenuBar.addAction(
	ajAction('animatedJavaSettings', {
		icon: 'settings',
		category: 'animatedJava',
		name: translate('animatedJava.menubar.settings'),
		condition: () => Format.id === ajModelFormat.id,
		click: function () {
			openSettingsDialog()
		},
	}),
	'animatedJava'
)
