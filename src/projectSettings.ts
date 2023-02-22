import { Items } from './minecraft'
import { safeFunctionName } from './minecraft/util'
import { ajModelFormat } from './modelFormat'
import {
	AJCheckboxSetting,
	AJDropdownSetting,
	AJFolderSetting,
	AJInlineTextSetting,
} from './settings'
import { translate, translateError, translateWarning } from './translation'

export interface IAnimatedJavaProjectSettings {
	project_namespace: AJInlineTextSetting
	rig_item: AJInlineTextSetting
	rig_item_model: AJInlineTextSetting
	rig_export_folder: AJFolderSetting
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
			function onUpdate(settingData) {
				settingData.value = safeFunctionName(settingData.value)
				return settingData
			}
		),

		rig_item: new AJInlineTextSetting(
			{
				id: 'animated_java:rig_item',
				displayName: translate('animated_java.project_settings.rig_item'),
				description: translate('animated_java.project_settings.rig_item.description').split(
					'\n'
				),
				defaultValue: 'minecraft:white_dye',
				resettable: true,
			},
			function onUpdate(settingData) {
				if (settingData.value === '') {
					settingData.errors.push(
						translateError('animated_java.project_settings.rig_item.error.unset')
					)
					return settingData
				}

				if (settingData.value.includes(' ')) {
					settingData.errors.push(
						translateError(
							'animated_java.project_settings.rig_item.error.invalid_item',
							{
								error: translate(
									'animated_java.project_settings.rig_item.error.space'
								),
							}
						)
					)
					return settingData
				}

				const [namespace, path] = settingData.value.split(':')
				if (!(namespace && path)) {
					settingData.errors.push(
						translateError(
							'animated_java.project_settings.rig_item.error.invalid_item',
							{
								error: translate(
									'animated_java.project_settings.rig_item.error.invalid_namespace'
								),
							}
						)
					)
					return settingData
				}

				if (!Items.isItem(settingData.value)) {
					settingData.warnings.push(
						translateWarning(
							'animated_java.project_settings.rig_item.warning.unknown_item'
						)
					)
					return settingData
				}

				return settingData
			}
		),

		rig_item_model: new AJInlineTextSetting({
			id: 'animated_java:rig_item_model',
			displayName: translate('animated_java.project_settings.rig_item_model'),
			description: translate(
				'animated_java.project_settings.rig_item_model.description'
			).split('\n'),
			defaultValue: '',
			resettable: true,
		}),

		rig_export_folder: new AJFolderSetting({
			id: 'animated_java:rig_export_folder',
			displayName: translate('animated_java.project_settings.rig_export_folder'),
			description: translate(
				'animated_java.project_settings.rig_export_folder.description'
			).split('\n'),
			defaultValue: '',
			resettable: true,
		}),

		verbose: new AJCheckboxSetting({
			id: 'animated_java:verbose',
			displayName: translate('animated_java.project_settings.verbose'),
			description: translate('animated_java.project_settings.verbose.description').split(
				'\n'
			),
			defaultValue: true,
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

const _ = getDefaultProjectSettings()
export const projectSettingStructure = [
	{
		type: 'setting',
		id: _.project_namespace.id,
	},
	{
		type: 'section',
		title: translate('animated_java.project_settings.rig_settings'),
		children: [
			{
				type: 'setting',
				id: _.rig_item.id,
			},
			{
				type: 'setting',
				id: _.rig_item_model.id,
			},
			{
				type: 'setting',
				id: _.rig_export_folder.id,
			},
		],
	},
	{
		type: 'setting',
		id: _.exporter.id,
	},
	{
		type: 'section',
		title: translate('animated_java.project_settings.exporter_settings'),
		children: [],
	},
]

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
