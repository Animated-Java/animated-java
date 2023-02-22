import { ajModelFormat } from '../modelFormat'
import { BlockbenchMod } from '../mods'
import { translate } from '../translation'
import { ajAction } from '../util/ajAction'
import { AJDialog } from './ajDialog'
import { default as SettingsComponent } from './components/projectSettings.svelte'

const oldProjectWindowClick = (BarItems.project_window as Action).click

function projectWindowClick(event: Event) {
	// console.log('projectWindowClick', event)
	if (Project?.format.id === ajModelFormat.id) {
		openAjProjectSettingsDialog()
	} else oldProjectWindowClick(event)
}

function openAjProjectSettingsDialog() {
	const dialog = new AJDialog(
		SettingsComponent,
		{
			settings: Project!.animated_java_settings,
		},
		{
			title: translate('animated_java.dialog.project_settings.title'),
			id: 'animated_java.project_settings',
			width: 700,
			buttons: [translate('animated_java.dialog.project_settings.close_button')],
		}
	)
	dialog.show()
}

new BlockbenchMod({
	id: 'animated_java:project_settings',
	inject() {
		;(BarItems.project_window as Action).click = projectWindowClick
	},
	extract() {
		;(BarItems.project_window as Action).click = oldProjectWindowClick
	},
})

MenuBar.addAction(
	ajAction('animated_java:project_settings', {
		icon: 'settings',
		category: 'animated_java',
		name: translate('animated_java.menubar.items.project_settings'),
		condition: () => Format.id === ajModelFormat.id,
		click: function () {
			openAjProjectSettingsDialog()
		},
	}),
	'animated_java'
)
