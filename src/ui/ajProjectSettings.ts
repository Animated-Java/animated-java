import { ajModelFormat } from '../modelFormat'
import { createBlockbenchMod } from '../util/mods'
import { translate } from '../util/translation'
import { ajAction } from '../util/ajAction'
import { AJDialog } from './ajDialog'
import { default as SettingsComponent } from './components/projectSettings.svelte'

function openAjProjectSettingsDialog() {
	const dialog = new AJDialog(
		SettingsComponent,
		{
			settings: Project!.animated_java_settings,
		},
		{
			title: translate('animated_java.dialog.project_settings.title'),
			id: 'animated_java:project_settings',
			width: 700,
			buttons: [translate('animated_java.dialog.project_settings.close_button')],
		}
	)
	dialog.show()
}

createBlockbenchMod(
	'animated_java:project_settings',
	{
		action: BarItems.project_window as Action,
		originalClick: (BarItems.project_window as Action).click,
	},
	context => {
		context.action.click = function (this: Action, event: MouseEvent) {
			if (Project?.format.id === ajModelFormat.id) {
				openAjProjectSettingsDialog()
			} else context.originalClick.call(this, event)
		}
		return context
	},
	context => {
		context.action.click = context.originalClick
	}
)

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
