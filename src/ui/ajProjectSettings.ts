import { ajModelFormat } from '../modelFormat'
import { createBlockbenchMod } from '../util/moddingTools'
import { translate } from '../util/translation'
import { default as SettingsComponent } from './components/projectSettings.svelte'
import { SvelteDialog } from './util/svelteDialog'

export function openAJProjectSettingsDialog() {
	if (!Project) return
	new SvelteDialog({
		title: translate('animated_java.dialog.project_settings.title'),
		id: 'animated_java:project_settings',
		width: 800,
		buttons: [translate('animated_java.dialog.close_button')],
		svelteComponent: SettingsComponent,
		svelteComponentProps: { settings: Project.animated_java_settings },
		onClose: () => {
			Object.values(Project.animated_java_settings!).forEach(s => {
				if (s.onConfirm) s.onConfirm(s)
			})
		},
	}).show()
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
				openAJProjectSettingsDialog()
			} else context.originalClick.call(this, event)
		}
		return context
	},
	context => {
		context.action.click = context.originalClick
	}
)
