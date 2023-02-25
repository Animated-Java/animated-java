import { Items } from './minecraft'
import { safeFunctionName } from './minecraft/util'
import { ajModelFormat } from './modelFormat'
import {
	CheckboxSetting,
	DropdownSetting,
	FileSetting,
	FolderSetting,
	InlineTextSetting,
	Setting,
} from './settings'
import { translate, translateInfo } from './translation'
import { GUIStructure } from './ui/uiStructure'

export interface IAnimatedJavaProjectSettings {
	project_namespace: InlineTextSetting
	rig_item: InlineTextSetting
	rig_item_model: InlineTextSetting
	rig_export_folder: FolderSetting
	verbose: CheckboxSetting
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
				defaultValue: 'untitled_project',
			},
			function onUpdate(setting) {
				setting.value = safeFunctionName(setting.value)
				return setting
			}
		),

		rig_item: new InlineTextSetting(
			{
				id: 'animated_java:rig_item',
				displayName: translate('animated_java.project_settings.rig_item'),
				description: translate('animated_java.project_settings.rig_item.description').split(
					'\n'
				),
				defaultValue: 'minecraft:white_dye',
				resettable: true,
			},
			function onUpdate(setting) {
				setting.value = setting.value.toLowerCase()

				if (setting.value === '') {
					setting.infoPopup = translateInfo(
						'error',
						'animated_java.project_settings.rig_item.error.unset'
					)
					return setting
				}

				if (setting.value.includes(' ')) {
					setting.infoPopup = translateInfo(
						'error',
						'animated_java.project_settings.rig_item.error.invalid_item',
						{
							error: translate('animated_java.project_settings.rig_item.error.space'),
						}
					)

					return setting
				}

				const [namespace, path] = setting.value.split(':')
				if (!(namespace && path)) {
					setting.infoPopup = translateInfo(
						'error',
						'animated_java.project_settings.rig_item.error.invalid_item',
						{
							error: translate(
								'animated_java.project_settings.rig_item.error.invalid_namespace'
							),
						}
					)

					return setting
				}

				if (!Items.isItem(setting.value)) {
					setting.infoPopup = translateInfo(
						'warning',
						'animated_java.project_settings.rig_item.warning.unknown_item'
					)

					return setting
				}

				return setting
			}
		),

		rig_item_model: new FileSetting({
			id: 'animated_java:rig_item_model',
			displayName: translate('animated_java.project_settings.rig_item_model'),
			description: translate(
				'animated_java.project_settings.rig_item_model.description'
			).split('\n'),
			defaultValue: '',
			resettable: true,
		}),

		rig_export_folder: new FolderSetting({
			id: 'animated_java:rig_export_folder',
			displayName: translate('animated_java.project_settings.rig_export_folder'),
			description: translate(
				'animated_java.project_settings.rig_export_folder.description'
			).split('\n'),
			defaultValue: '',
			resettable: true,
		}),

		verbose: new CheckboxSetting({
			id: 'animated_java:verbose',
			displayName: translate('animated_java.project_settings.verbose'),
			description: translate('animated_java.project_settings.verbose.description').split(
				'\n'
			),
			defaultValue: true,
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
			function onInit(setting) {
				setting.options = Object.values(AnimatedJavaExporter.exporters).map(exporter => ({
					name: exporter.name,
					value: exporter.id,
				}))
			}
		),
	}
}

const _ = getDefaultProjectSettings()
export const projectSettingStructure: GUIStructure = [
	{
		type: 'setting',
		id: _.project_namespace.id,
	},
	{
		type: 'group',
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
