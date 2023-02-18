import { ajModelFormat } from './modelFormat'
import { DropdownSetting, InlineTextSetting } from './settings'
import { translate } from './translation'

export interface IAnimatedJavaProjectSettings {
	project_name: InlineTextSetting
	exporter: DropdownSetting<string>
}

export function getDefaultProjectSettings(): IAnimatedJavaProjectSettings {
	return {
		project_name: new InlineTextSetting({
			id: 'animated_java:project_name',
			displayName: translate('animated_java.project_settings.project_name'),
			description: translate('animated_java.project_settings.project_name.description').split(
				'\n'
			),
			defaultValue: 'Untitled',
		}),
		exporter: new DropdownSetting<string>(
			{
				id: 'animated_java:exporter',
				displayName: translate('animated_java.project_settings.exporter'),
				description: translate('animated_java.project_settings.exporter.description').split(
					'\n'
				),
				defaultValue: 0,
				options: [],
			},
			undefined,
			function onOpen(setting) {
				setting.options = Object.values(AnimatedJavaExporter.exporters).map(exporter => ({
					displayName: exporter.name,
					description: exporter.description.split('\n'),
					value: exporter.id,
				}))
			}
		),
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
