import { ajModelFormat } from './modelFormat'
import * as Settings from './settings'
import { translate } from './translation'

export function getDefaultProjectSettings(): Settings.SettingObject {
	return {
		project_name: new Settings.TextSetting({
			id: 'animated_java:project_name',
			displayName: translate('animated_java.project_settings.project_name'),
			description: translate('animated_java.project_settings.project_name.description').split(
				'\n'
			),
			displayType: 'inline',
			defaultValue: 'Untitled',
		}),
	}
}

function updateProjectSettings() {
	console.log('updateProjectSettings', Project)
	if (Project?.format.id === ajModelFormat.id) {
		if (!Project.animated_java_settings) {
			Project.animated_java_settings = getDefaultProjectSettings()
		}
	}
}

Blockbench.on('load_project', updateProjectSettings)
Blockbench.on('select_project', updateProjectSettings)
