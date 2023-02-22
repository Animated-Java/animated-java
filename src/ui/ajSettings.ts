import { ajModelFormat } from '../modelFormat'
import { translate } from '../translation'
import { ajAction } from '../util/ajAction'
// @ts-ignore
import logo from '../assets/AnimatedJava-2022.svg'
import { AJDialog } from './ajDialog'
import { default as SettingsComponent } from './animatedJavaSettings.svelte'
import { AnimatedJavaSettings } from '../settings'

export const menuBarEntry: any = new BarMenu(
	'animated_java',
	[],
	() => Format.id === ajModelFormat.id
)
menuBarEntry.label.style.display = 'none'
document.querySelector('#menu_bar')!.appendChild(menuBarEntry.label)

let img = document.createElement('img')
menuBarEntry.label.innerHTML = translate('animated_java.menubar.settings')
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
	const dialog = new AJDialog(
		SettingsComponent,
		{
			settings: AnimatedJavaSettings,
		},
		{
			title: translate('animated_java.dialog.settings.title'),
			id: 'animated_java.settings',
			width: 700,
			buttons: [translate('animated_java.dialog.settings.close_button')],
		}
	)
	dialog.show()
}

MenuBar.addAction(
	ajAction('animated_java:settings', {
		icon: 'settings',
		category: 'animated_java',
		name: translate('animated_java.menubar.items.settings'),
		condition: () => Format.id === ajModelFormat.id,
		click: function () {
			openAjSettingsDialog()
		},
	}),
	'animated_java'
)
