import { ajModelFormat } from '../modelFormat'
import { translate } from '../translation'
import { ajAction } from '../util/ajAction'
// @ts-ignore
import logo from '../assets/AnimatedJava-2022.svg'
import { AJDialog } from './ajDialog'
import { default as SettingsComponent } from './settings.svelte'

export const menuBarEntry: any = new BarMenu(
	'animatedJava',
	[],
	() => Format.id === ajModelFormat.id
)
menuBarEntry.label.style.display = 'none'
document.querySelector('#menu_bar')!.appendChild(menuBarEntry.label)

let img = document.createElement('img')
menuBarEntry.label.innerHTML = translate('animatedJava.menubar.settings')
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

export function openAjSettingsDialog() {
	const dialog = new AJDialog({
		// @ts-ignore
		svelteComponent: SettingsComponent,
		title: translate('animatedJava.dialog.settings.title'),
		id: 'animatedJava.settings',
	})
	dialog.show()
}

MenuBar.addAction(
	ajAction('animatedJavaSettings', {
		icon: 'settings',
		category: 'animatedJava',
		name: translate('animatedJava.menubar.items.settings'),
		condition: () => Format.id === ajModelFormat.id,
		click: function () {
			openAjSettingsDialog()
		},
	}),
	'animatedJava'
)
