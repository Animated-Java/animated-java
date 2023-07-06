import { AnimatedJavaExporter } from './exporter'
import { GUIStructure } from './guiStructure'
import { Items } from './minecraft'
import {
	isValidResourcePackMcMeta,
	isValidResourcePackPath,
	safeFunctionName,
} from './minecraft/util'
import { ajModelFormat } from './modelFormat'
import * as Settings from './settings'
import { translate } from './util/translation'
import * as events from './events'

export interface IAnimatedJavaProjectSettings {
	project_namespace: Settings.InlineTextSetting
	project_resolution: Settings.DoubleNumberSetting
	target_minecraft_version: Settings.DropdownSetting<string>
	rig_item: Settings.InlineTextSetting
	rig_item_model: Settings.InlineTextSetting
	rig_export_folder: Settings.FolderSetting
	texture_export_folder: Settings.FolderSetting
	enable_advanced_resource_pack_settings: Settings.CheckboxSetting
	resource_pack_mcmeta: Settings.FileSetting
	verbose: Settings.CheckboxSetting
	exporter: Settings.DropdownSetting<string>
}

const TRANSLATIONS = {
	project_namespace: {
		displayName: translate('animated_java.project_settings.project_namespace'),
		description: translate(
			'animated_java.project_settings.project_namespace.description'
		).split('\n'),
		error: {
			unset: translate('animated_java.project_settings.project_namespace.error.unset'),
		},
	},
	project_resolution: {
		displayName: translate('animated_java.project_settings.project_resolution'),
		description: translate(
			'animated_java.project_settings.project_resolution.description'
		).split('\n'),
	},
	target_minecraft_version: {
		displayName: translate('animated_java.project_settings.target_minecraft_version'),
		description: translate(
			'animated_java.project_settings.target_minecraft_version.description'
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
	texture_export_folder: {
		displayName: translate('animated_java.project_settings.texture_export_folder'),
		description: translate(
			'animated_java.project_settings.texture_export_folder.description'
		).split('\n'),
		error: {
			unset: translate('animated_java.project_settings.texture_export_folder.error.unset'),
			invalid_path: translate(
				'animated_java.project_settings.texture_export_folder.error.invalid_path'
			),
		},
	},
	enable_advanced_resource_pack_settings: {
		displayName: translate(
			'animated_java.project_settings.enable_advanced_resource_pack_settings'
		),
		description: translate(
			'animated_java.project_settings.enable_advanced_resource_pack_settings.description'
		).split('\n'),
	},
	resource_pack_mcmeta: {
		displayName: translate('animated_java.project_settings.resource_pack_mcmeta'),
		description: translate(
			'animated_java.project_settings.resource_pack_mcmeta.description'
		).split('\n'),
		error: {
			unset: translate('animated_java.project_settings.resource_pack_mcmeta.error.unset'),
			invalid_path: translate(
				'animated_java.project_settings.resource_pack_mcmeta.error.invalid_path'
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
		project_namespace: new Settings.InlineTextSetting(
			{
				id: 'animated_java:project_settings/project_namespace',
				displayName: TRANSLATIONS.project_namespace.displayName,
				description: TRANSLATIONS.project_namespace.description,
				defaultValue: '',
				docsLink: '/docs/project_settings#project_namespace',
				get subtext() {
					return Project?.animated_java_uuid
				},
			},
			function onUpdate(setting) {
				if (setting.value === '')
					setting.infoPopup = Settings.createInfo(
						'error',
						TRANSLATIONS.project_namespace.error.unset
					)
				setting.value = safeFunctionName(setting.value)
				return setting
			}
		),

		project_resolution: new Settings.DoubleNumberSetting(
			{
				id: 'animated_java:project_settings/project_resolution',
				displayName: TRANSLATIONS.project_resolution.displayName,
				description: TRANSLATIONS.project_resolution.description,
				get defaultValue(): [number, number] {
					return [Project!.texture_width, Project!.texture_height]
				},
				min: 1,
				secondNumberLabel: 'x',
				docsLink: '/docs/project_settings#project_resolution',
			},
			undefined,
			undefined,
			function onConfirm(setting) {
				setProjectResolution(setting.numberA, setting.numberB, true)
			}
		),

		target_minecraft_version: new Settings.DropdownSetting({
			id: 'animated_java:project_settings/target_minecraft_version',
			displayName: TRANSLATIONS.target_minecraft_version.displayName,
			description: TRANSLATIONS.target_minecraft_version.description,
			defaultValue: 0,
			options: [
				{
					name: '1.20+',
					value: '1.20+',
				},
				{
					name: '1.19.4',
					value: '1.19.4',
				},
			],
			docsLink: '/docs/project_settings#target_minecraft_version',
		}),

		rig_item: new Settings.InlineTextSetting(
			{
				id: 'animated_java:project_settings/rig_item',
				displayName: TRANSLATIONS.rig_item.displayName,
				description: TRANSLATIONS.rig_item.description,
				defaultValue: 'minecraft:white_dye',
				// resettable: true,
				docsLink: '/docs/project_settings#rig_item',
			},
			function onUpdate(setting) {
				setting.value = setting.value.toLowerCase()

				if (setting.value === '') {
					setting.infoPopup = Settings.createInfo(
						'error',
						TRANSLATIONS.rig_item.error.unset
					)
					return
				} else if (setting.value.includes(' ')) {
					setting.infoPopup = Settings.createInfo(
						'error',
						TRANSLATIONS.rig_item.error.space
					)
					return
				}

				const [namespace, path] = setting.value.split(':')
				if (!(namespace && path)) {
					setting.infoPopup = Settings.createInfo(
						'error',
						TRANSLATIONS.rig_item.error.invalid_namespace
					)
					return
				}

				if (!Items.isItem(setting.value)) {
					setting.infoPopup = Settings.createInfo(
						'warning',
						TRANSLATIONS.rig_item.warning.unknown_item
					)
					return
				}

				return
			}
		),

		rig_item_model: new Settings.FileSetting(
			{
				id: 'animated_java:project_settings/rig_item_model',
				displayName: TRANSLATIONS.rig_item_model.displayName,
				description: TRANSLATIONS.rig_item_model.description,
				defaultValue: '',
				// resettable: true,
				docsLink: '/docs/project_settings#rig_item_model',
				dependsOn: ['animated_java:project_settings/rig_item'],
			},
			function onUpdate(setting) {
				if (!setting.value) {
					setting.infoPopup = Settings.createInfo(
						'error',
						TRANSLATIONS.rig_item_model.error.unset
					)
					return setting
				} else if (!isValidResourcePackPath(setting.value)) {
					setting.infoPopup = Settings.createInfo(
						'error',
						TRANSLATIONS.rig_item_model.error.invalid_path
					)
					return setting
				}
				const parsed = PathModule.parse(setting.value)
				const rigItem = Project?.animated_java_settings?.rig_item?.value
				if (!rigItem) {
					setting.infoPopup = Settings.createInfo(
						'error',
						TRANSLATIONS.rig_item_model.error.rig_item_unset
					)
					return setting
				}
				const [, itemId] = rigItem.split(':')
				if (parsed.name !== itemId) {
					setting.infoPopup = Settings.createInfo(
						'error',
						TRANSLATIONS.rig_item_model.error.item_does_not_match,
						{ rigItem: itemId, pathItem: parsed.name }
					)
					return setting
				}
			}
		),

		rig_export_folder: new Settings.FolderSetting(
			{
				id: 'animated_java:project_settings/rig_export_folder',
				displayName: TRANSLATIONS.rig_export_folder.displayName,
				description: TRANSLATIONS.rig_export_folder.description,
				defaultValue: '',
				// resettable: true,
				docsLink: '/docs/project_settings#rig_export_folder',
			},
			function onUpdate(setting) {
				if (!setting.value) {
					setting.infoPopup = Settings.createInfo(
						'error',
						TRANSLATIONS.rig_export_folder.error.unset
					)
					return setting
				} else if (!isValidResourcePackPath(setting.value)) {
					setting.infoPopup = Settings.createInfo(
						'error',
						TRANSLATIONS.rig_export_folder.error.invalid_path
					)
					return setting
				}
			}
		),

		texture_export_folder: new Settings.FolderSetting(
			{
				id: 'animated_java:project_settings/texture_export_folder',
				displayName: TRANSLATIONS.texture_export_folder.displayName,
				description: TRANSLATIONS.texture_export_folder.description,
				defaultValue: '',
				// resettable: true,
				docsLink: '/docs/project_settings#texture_export_folder',
			},
			function onUpdate(setting) {
				if (!setting.value) {
					setting.infoPopup = Settings.createInfo(
						'error',
						TRANSLATIONS.texture_export_folder.error.unset
					)
					return setting
				} else if (!isValidResourcePackPath(setting.value)) {
					setting.infoPopup = Settings.createInfo(
						'error',
						TRANSLATIONS.texture_export_folder.error.invalid_path
					)
					return setting
				}
			}
		),

		enable_advanced_resource_pack_settings: new Settings.CheckboxSetting({
			id: 'animated_java:project_settings/enable_advanced_resource_pack_settings',
			displayName: TRANSLATIONS.enable_advanced_resource_pack_settings.displayName,
			description: TRANSLATIONS.enable_advanced_resource_pack_settings.description,
			defaultValue: false,
			docsLink: '/docs/project_settings#enable_advanced_resource_pack_settings',
		}),

		resource_pack_mcmeta: new Settings.FileSetting(
			{
				id: 'animated_java:project_settings/resource_pack_mcmeta',
				displayName: TRANSLATIONS.resource_pack_mcmeta.displayName,
				description: TRANSLATIONS.resource_pack_mcmeta.description,
				defaultValue: '',
				// resettable: true,
				docsLink: '/docs/project_settings#resource_pack',
			},
			function onUpdate(setting) {
				if (!setting.value) {
					setting.infoPopup = Settings.createInfo(
						'error',
						TRANSLATIONS.resource_pack_mcmeta.error.unset
					)
					return setting
				} else if (!isValidResourcePackMcMeta(setting.value)) {
					setting.infoPopup = Settings.createInfo(
						'error',
						TRANSLATIONS.resource_pack_mcmeta.error.invalid_path
					)
					return setting
				}
			}
		),

		verbose: new Settings.CheckboxSetting({
			id: 'animated_java:project_settings/verbose',
			displayName: TRANSLATIONS.verbose.displayName,
			description: TRANSLATIONS.verbose.description,
			defaultValue: true,
			docsLink: '/docs/project_settings#verbose',
		}),

		exporter: new Settings.DropdownSetting<string>(
			{
				id: 'animated_java:project_settings/exporter',
				displayName: TRANSLATIONS.exporter.displayName,
				description: TRANSLATIONS.exporter.description,
				defaultValue: 0,
				docsLink: '/docs/project_settings#exporter',
				options: [],
			},
			undefined,
			function onInit(setting) {
				setting.options = AnimatedJavaExporter.all.map(exporter => ({
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
		type: 'group',
		title: translate('animated_java.dialog.project_settings.project_group'),
		openByDefault: true,
		children: [
			{
				type: 'setting',
				settingId: _.project_namespace.id,
			},
			{
				type: 'setting',
				settingId: _.project_resolution.id,
			},
			{
				type: 'setting',
				settingId: _.target_minecraft_version.id,
			},
		],
	},
	{
		type: 'group',
		title: translate('animated_java.project_settings.resourcepack_group'),
		openByDefault: true,
		children: [
			{
				type: 'setting',
				settingId: _.rig_item.id,
			},
			{
				type: 'toggle',
				title: _.enable_advanced_resource_pack_settings.displayName,
				settingId: _.enable_advanced_resource_pack_settings.id,
				active: [
					{
						type: 'setting',
						settingId: _.rig_item_model.id,
					},
					{
						type: 'setting',
						settingId: _.rig_export_folder.id,
					},
					{
						type: 'setting',
						settingId: _.texture_export_folder.id,
					},
				],
				inactive: [
					{
						type: 'setting',
						settingId: _.resource_pack_mcmeta.id,
					},
				],
			},
		],
	},
	{
		type: 'setting',
		settingId: _.exporter.id,
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
events.CONVERT_PROJECT.subscribe(updateProjectSettings)
events.SELECT_PROJECT.subscribe(updateProjectSettings)
