import { safeFunctionName } from './minecraft/util'
import { ajModelFormat } from './modelFormat'
import { DropdownSetting, InlineTextSetting } from './settings'
import { translate } from './translation'

export interface IAnimatedJavaProjectSettings {
	project_namespace: InlineTextSetting
	exporter: DropdownSetting<string>
}

export function getDefaultProjectSettings(): IAnimatedJavaProjectSettings {
	return {
		project_namespace: new InlineTextSetting(
			{
				id: 'animated_java:project_namespace',
				displayName: translate('animated_java.project_settings.project_namespace'),
				description: translate(
					'animated_java.project_settings.project_namespace.description'
				).split('\n'),
				defaultValue: 'Untitled',
			},
			function onUpdate(setting) {
				setting._value = safeFunctionName(setting._value)
			}
		),
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
			function onInit(setting) {
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
