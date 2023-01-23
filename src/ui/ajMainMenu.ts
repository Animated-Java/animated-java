import { ajModelFormat } from '../modelFormat'
import { translate } from '../translation'
import { ajAction } from '../util/ajAction'
import { openAjSettingsDialog } from './ajSettings'
// @ts-ignore
import logo from '../assets/AnimatedJava-2022.svg'

export const menuBarEntry: any = new BarMenu(
	'animatedJava',
	[],
	() => Format.id === ajModelFormat.id
)
menuBarEntry.label.style.display = 'none'
document.querySelector('#menu_bar')!.appendChild(menuBarEntry.label)

let img = document.createElement('img')
menuBarEntry.label.innerHTML = translate('animatedJava.ui.mainMenu')
img.src = logo
img.width = 16
img.height = 16
img.style.position = 'relative'
img.style.top = '2px'
img.style.borderRadius = '8px'
img.style.marginRight = '5px'
menuBarEntry.label.prepend(img)

Blockbench.on('select_project', data => {
	queueMicrotask(() => {
		menuBarEntry.label.style.display = Format.id === ajModelFormat.id ? 'inline-block' : 'none'
	})
})

Blockbench.on('unselect_project', data => {
	menuBarEntry.label.style.display = 'none'
})

Blockbench.on('resize_window', data => {})

MenuBar.addAction(
	ajAction('animatedJavaSettings', {
		icon: 'settings',
		category: 'animatedJava',
		name: translate('animatedJava.menubar.settings'),
		condition: () => Format.id === ajModelFormat.id,
		click: function () {
			openAjSettingsDialog()
		},
	}),
	'animatedJava'
)
