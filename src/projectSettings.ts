import { safeFunctionName } from './minecraft/util'
import { ajModelFormat } from './modelFormat'
import {
	AJCheckboxSetting,
	AJDropdownSetting,
	AJFolderSetting,
	AJInlineTextSetting,
	AJTitleSetting,
} from './settings'
import { translate } from './translation'

export interface IAnimatedJavaProjectSettings {
	project_namespace: AJInlineTextSetting
	resourcepack_title: AJTitleSetting
	rig_item: AJInlineTextSetting
	rig_item_model: AJInlineTextSetting
	rig_export_folder: AJFolderSetting
	datapack_title: AJTitleSetting
	verbose: AJCheckboxSetting
	exporter: AJDropdownSetting<string>
}

export function getDefaultProjectSettings(): IAnimatedJavaProjectSettings {
	return {
		project_namespace: new AJInlineTextSetting(
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

		resourcepack_title: new AJTitleSetting({
			id: 'animated_java:resourcepack_title',
			displayName: translate('animated_java.project_settings.resourcepack_title'),
			description: [],
			defaultValue: null,
		}),

		rig_item: new AJInlineTextSetting({
			id: 'animated_java:statue_exporter:rig_item',
			displayName: translate('animated_java.project_settings.rig_item'),
			description: translate('animated_java.project_settings.rig_item.description').split(
				'\n'
			),
			defaultValue: 'minecraft:stone',
		}),

		rig_item_model: new AJInlineTextSetting({
			id: 'animated_java:statue_exporter:rig_item_model',
			displayName: translate('animated_java.project_settings.rig_item_model'),
			description: translate(
				'animated_java.project_settings.rig_item_model.description'
			).split('\n'),
			defaultValue: '',
		}),

		rig_export_folder: new AJFolderSetting({
			id: 'animated_java:statue_exporter:rig_export_folder',
			displayName: translate('animated_java.project_settings.rig_export_folder'),
			description: translate(
				'animated_java.project_settings.rig_export_folder.description'
			).split('\n'),
			defaultValue: '',
		}),

		datapack_title: new AJTitleSetting({
			id: 'animated_java:datapack_title',
			displayName: translate('animated_java.project_settings.datapack_title'),
			description: [],
			defaultValue: null,
		}),

		verbose: new AJCheckboxSetting({
			id: 'animated_java:verbose',
			displayName: translate('animated_java.project_settings.verbose'),
			description: translate('animated_java.project_settings.verbose.description').split(
				'\n'
			),
			defaultValue: false,
		}),

		exporter: new AJDropdownSetting<string>(
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
