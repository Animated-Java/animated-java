import { Items } from './minecraft'
import { isValidResourcePackPath, safeFunctionName } from './minecraft/util'
import { ajModelFormat } from './modelFormat'
import {
	CheckboxSetting,
	createInfo,
	DropdownSetting,
	FileSetting,
	FolderSetting,
	InlineTextSetting,
} from './settings'
import * as events from './util/events'
import { GUIStructure } from './ui/ajUIStructure'
import { translate } from './util/translation'

export interface IAnimatedJavaProjectSettings {
	project_namespace: InlineTextSetting
	rig_item: InlineTextSetting
	rig_item_model: InlineTextSetting
	rig_export_folder: FolderSetting
	verbose: CheckboxSetting
	exporter: DropdownSetting<string>
}

const TRANSLATIONS = {
	project_namespace: {
		displayName: translate('animated_java.project_settings.project_namespace'),
		description: translate(
			'animated_java.project_settings.project_namespace.description'
		).split('\n'),
	},
	rig_item: {
		displayName: translate('animated_java.project_settings.rig_item'),
		description: translate('animated_java.project_settings.rig_item.description').split('\n'),
		error: {
			unset: translate('animated_java.project_settings.rig_item.error.unset'),
			space: translate('animated_java.project_settings.rig_item.error.space'),
			invalid_item: translate('animated_java.project_settings.rig_item.error.invalid_item'),
			invalid_namespace: translate(
				'animated_java.project_settings.rig_item.error.invalid_namespace'
			),
		},
		warning: {
			unknown_item: translate('animated_java.project_settings.rig_item.warning.unknown_item'),
		},
	},
	rig_item_model: {
		displayName: translate('animated_java.project_settings.rig_item_model'),
		description: translate('animated_java.project_settings.rig_item_model.description').split(
			'\n'
		),
		error: {
			unset: translate('animated_java.project_settings.rig_item_model.error.unset'),
			invalid_path: translate(
				'animated_java.project_settings.rig_item_model.error.invalid_path'
			),
			item_does_not_match: translate(
				'animated_java.project_settings.rig_item_model.error.item_does_not_match'
			),
			rig_item_unset: translate(
				'animated_java.project_settings.rig_item_model.error.rig_item_unset'
			),
		},
	},
	rig_export_folder: {
		displayName: translate('animated_java.project_settings.rig_export_folder'),
		description: translate(
			'animated_java.project_settings.rig_export_folder.description'
		).split('\n'),
		error: {
			unset: translate('animated_java.project_settings.rig_export_folder.error.unset'),
			invalid_path: translate(
				'animated_java.project_settings.rig_export_folder.error.invalid_path'
			),
		},
	},
	verbose: {
		displayName: translate('animated_java.project_settings.verbose'),
		description: translate('animated_java.project_settings.verbose.description').split('\n'),
	},
	exporter: {
		displayName: translate('animated_java.project_settings.exporter'),
		description: translate('animated_java.project_settings.exporter.description').split('\n'),
	},
}

export function getDefaultProjectSettings(): IAnimatedJavaProjectSettings {
	return {
		project_namespace: new InlineTextSetting(
			{
				id: 'animated_java:project_settings/project_namespace',
				displayName: TRANSLATIONS.project_namespace.displayName,
				description: TRANSLATIONS.project_namespace.description,
				defaultValue: 'untitled_project',
				docsLink: 'page:project_settings#project_namespace',
			},
			function onUpdate(setting) {
				setting.value = safeFunctionName(setting.value)
				return setting
			}
		),

		rig_item: new InlineTextSetting(
			{
				id: 'animated_java:project_settings/rig_item',
				displayName: TRANSLATIONS.rig_item.displayName,
				description: TRANSLATIONS.rig_item.description,
				defaultValue: 'minecraft:white_dye',
				resettable: true,
				docsLink: 'page:project_settings#rig_item',
			},
			function onUpdate(setting) {
				setting.value = setting.value.toLowerCase()

				if (setting.value === '') {
					setting.infoPopup = createInfo('error', TRANSLATIONS.rig_item.error.unset)
					return
				} else if (setting.value.includes(' ')) {
					setting.infoPopup = createInfo('error', TRANSLATIONS.rig_item.error.space)
					return
				}

				const [namespace, path] = setting.value.split(':')
				if (!(namespace && path)) {
					setting.infoPopup = createInfo(
						'error',
						TRANSLATIONS.rig_item.error.invalid_namespace
					)
					return
				}

				if (!Items.isItem(setting.value)) {
					setting.infoPopup = createInfo(
						'warning',
						TRANSLATIONS.rig_item.warning.unknown_item
					)
					return
				}

				return
			}
		),

		rig_item_model: new FileSetting(
			{
				id: 'animated_java:project_settings/rig_item_model',
				displayName: TRANSLATIONS.rig_item_model.displayName,
				description: TRANSLATIONS.rig_item_model.description,
				defaultValue: '',
				resettable: true,
				docsLink: 'page:project_settings#rig_item_model',
				dependsOn: ['animated_java:project_settings/rig_item'],
			},
			function onUpdate(setting) {
				if (!setting.value) {
					setting.infoPopup = createInfo('error', TRANSLATIONS.rig_item_model.error.unset)
					return setting
				} else if (!isValidResourcePackPath(setting.value)) {
					setting.infoPopup = createInfo(
						'error',
						TRANSLATIONS.rig_item_model.error.invalid_path
					)
					return setting
				}
				const parsed = PathModule.parse(setting.value)
				const rigItem = Project?.animated_java_settings?.rig_item?.value
				if (!rigItem) {
					setting.infoPopup = createInfo(
						'error',
						TRANSLATIONS.rig_item_model.error.rig_item_unset
					)
					return setting
				}
				const [, itemId] = rigItem.split(':')
				if (parsed.name !== itemId) {
					setting.infoPopup = createInfo(
						'error',
						TRANSLATIONS.rig_item_model.error.item_does_not_match,
						{ rigItem: itemId, pathItem: parsed.name }
					)
					return setting
				}
			}
		),

		rig_export_folder: new FolderSetting(
			{
				id: 'animated_java:project_settings/rig_export_folder',
				displayName: TRANSLATIONS.rig_export_folder.displayName,
				description: TRANSLATIONS.rig_export_folder.description,
				defaultValue: '',
				resettable: true,
				docsLink: 'page:project_settings#rig_export_folder',
			},
			function onUpdate(setting) {
				if (!setting.value) {
					setting.infoPopup = createInfo(
						'error',
						TRANSLATIONS.rig_export_folder.error.unset
					)
					return setting
				} else if (!isValidResourcePackPath(setting.value)) {
					setting.infoPopup = createInfo(
						'error',
						TRANSLATIONS.rig_export_folder.error.invalid_path
					)
					return setting
				}
			}
		),

		verbose: new CheckboxSetting({
			id: 'animated_java:project_settings/verbose',
			displayName: TRANSLATIONS.verbose.displayName,
			description: TRANSLATIONS.verbose.description,
			defaultValue: true,
			docsLink: 'page:project_settings#verbose',
		}),

		exporter: new DropdownSetting<string>(
			{
				id: 'animated_java:project_settings/exporter',
				displayName: TRANSLATIONS.exporter.displayName,
				description: TRANSLATIONS.exporter.description,
				defaultValue: 0,
				docsLink: 'page:project_settings#exporter',
				options: [],
			},
			undefined,
			function onInit(setting) {
				setting.options = AnimatedJava.Exporter.all.map(exporter => ({
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
	if (!Project) return
	console.log('updateProjectSettings', Project)
	if (Format === ajModelFormat) {
		if (!Project.animated_java_settings) {
			Project.animated_java_settings = getDefaultProjectSettings()
		}
		for (const setting of Object.values(Project.animated_java_settings)) {
			setting._onInit()
		}
	}
}

events.LOAD_PROJECT.subscribe(updateProjectSettings)
events.SELECT_PROJECT.subscribe(updateProjectSettings)
