import { ajModelFormat } from '../modelFormat'
import { createAction, createBlockbenchMod } from '../util/moddingTools'
import { translate } from '../util/translation'
import { SvelteDialog } from './svelteDialog'
import { default as SettingsComponent } from './components/projectSettings.svelte'

function openAjProjectSettingsDialog() {
	if (!Project) return
	const dialog = new SvelteDialog({
		title: translate('animated_java.dialog.project_settings.title'),
		id: 'animated_java:project_settings',
		width: 700,
		buttons: [translate('animated_java.dialog.close_button')],
		svelteComponent: SettingsComponent,
		svelteComponentProps: { settings: Project.animated_java_settings },
	})
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
	createAction('animated_java:project_settings', {
		icon: 'settings',
		category: 'animated_java',
		name: translate('animated_java.menubar.items.project_settings'),
		condition: () => Format === ajModelFormat,
		click: function () {
			openAjProjectSettingsDialog()
		},
	}),
	'animated_java'
)
