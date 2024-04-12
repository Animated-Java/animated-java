import { generateDatapack } from './exporter/gen/datapack'
import { loadTranslations } from './exporter/translations'

export function loadExporter() {
	const { Settings, createInfo, Exporter, translate } = AnimatedJava.API
	const { isValidDataPackMcMeta } = AnimatedJava.API.minecraft
	const { NbtTag } = AnimatedJava.API.deepslate

	const TRANSLATIONS = loadTranslations()

	return new Exporter({
		id: 'animated_java:datapack_exporter',
		name: translate('animated_java.datapack_exporter.name'),
		description: translate('animated_java.datapack_exporter.description'),
		getSettings() {
			return {
				datapack_mcmeta: new Settings.FileSetting(
					{
						id: 'animated_java:datapack_exporter/datapack_mcmeta',
						displayName: TRANSLATIONS.datapack_mcmeta.name,
						description: TRANSLATIONS.datapack_mcmeta.description,
						defaultValue: '',
						docsLink: '/docs/exporters/datapack_exporter/settings#datapack',
					},
					function onUpdate(setting) {
						if (!setting.value) {
							setting.infoPopup = createInfo(
								'error',
								TRANSLATIONS.datapack_mcmeta.error.unset
							)
						} else if (!isValidDataPackMcMeta(setting.value)) {
							setting.infoPopup = createInfo(
								'error',
								TRANSLATIONS.datapack_mcmeta.error.invalid
							)
						}
					}
				),
				outdated_rig_warning: new Settings.CheckboxSetting({
					id: 'animated_java:datapack_exporter/outdated_rig_warning',
					displayName: TRANSLATIONS.enable_outdated_rig_warning.name,
					description: TRANSLATIONS.enable_outdated_rig_warning.description,
					defaultValue: true,
					docsLink: '/docs/exporters/datapack_exporter/settings#outdated_rig_warning',
				}),
				root_entity_nbt: new Settings.CodeboxSetting(
					{
						id: 'animated_java:datapack_exporter/root_entity_nbt',
						displayName: TRANSLATIONS.root_entity_nbt.name,
						description: TRANSLATIONS.root_entity_nbt.description,
						language: 'nbt',
						defaultValue: '{}',
						docsLink: '/docs/exporters/datapack_exporter/settings#root_entity_nbt',
					},
					function onUpdate(setting) {
						try {
							NbtTag.fromString(setting.value)
						} catch (e: any) {
							setting.infoPopup = createInfo('error', e.message)
						}
					}
				),
				use_component_system: new Settings.CheckboxSetting({
					id: 'animated_java:datapack_exporter/use_component_system',
					displayName: TRANSLATIONS.use_component_system.name,
					description: TRANSLATIONS.use_component_system.description,
					defaultValue: false,
					docsLink: '/docs/exporters/datapack_exporter/settings#use_component_system',
				}),
				// Function Toggles
				include_variant_summon_functions: new Settings.CheckboxSetting({
					id: 'animated_java:datapack_exporter/include_variant_summon_functions',
					displayName: TRANSLATIONS.include_variant_summon_functions.name,
					description: TRANSLATIONS.include_variant_summon_functions.description,
					defaultValue: true,
					docsLink:
						'/docs/exporters/datapack_exporter/settings#include_variant_summon_functions',
				}),
				include_apply_variant_functions: new Settings.CheckboxSetting({
					id: 'animated_java:datapack_exporter/include_apply_variant_functions',
					displayName: TRANSLATIONS.include_apply_variant_functions.name,
					description: TRANSLATIONS.include_apply_variant_functions.description,
					defaultValue: true,
					docsLink:
						'/docs/exporters/datapack_exporter/settings#include_apply_variant_functions',
				}),
				include_uninstall_function: new Settings.CheckboxSetting({
					id: 'animated_java:datapack_exporter/include_uninstall_function',
					displayName: TRANSLATIONS.include_uninstall_function.name,
					description: TRANSLATIONS.include_uninstall_function.description,
					defaultValue: true,
					docsLink:
						'/docs/exporters/datapack_exporter/settings#include_uninstall_function',
				}),
				include_pause_all_animations_function: new Settings.CheckboxSetting({
					id: 'animated_java:datapack_exporter/include_pause_all_animations_function',
					displayName: TRANSLATIONS.include_pause_all_animations_function.name,
					description: TRANSLATIONS.include_pause_all_animations_function.description,
					defaultValue: true,
					docsLink:
						'/docs/exporters/datapack_exporter/settings#include_pause_all_animations_function',
				}),
				include_remove_rigs_function: new Settings.CheckboxSetting({
					id: 'animated_java:datapack_exporter/include_remove_rigs_function',
					displayName: TRANSLATIONS.include_remove_rigs_function.name,
					description: TRANSLATIONS.include_remove_rigs_function.description,
					defaultValue: true,
					docsLink:
						'/docs/exporters/datapack_exporter/settings#include_remove_rigs_function',
				}),
				include_remove_all_function: new Settings.CheckboxSetting({
					id: 'animated_java:datapack_exporter/include_remove_all_function',
					displayName: TRANSLATIONS.include_remove_all_function.name,
					description: TRANSLATIONS.include_remove_all_function.description,
					defaultValue: true,
					docsLink:
						'/docs/exporters/datapack_exporter/settings#include_remove_all_function',
				}),
				// Tag Toggles
				include_on_load_function_tags: new Settings.CheckboxSetting({
					id: 'animated_java:datapack_exporter/include_on_load_function_tags',
					displayName: TRANSLATIONS.include_on_load_function_tags.name,
					description: TRANSLATIONS.include_on_load_function_tags.description,
					defaultValue: true,
					docsLink:
						'/docs/exporters/datapack_exporter/settings#include_on_load_function_tags',
				}),
				include_on_tick_function_tags: new Settings.CheckboxSetting({
					id: 'animated_java:datapack_exporter/include_on_tick_function_tags',
					displayName: TRANSLATIONS.include_on_tick_function_tags.name,
					description: TRANSLATIONS.include_on_tick_function_tags.description,
					defaultValue: true,
					docsLink:
						'/docs/exporters/datapack_exporter/settings#include_on_tick_function_tags',
				}),
				include_on_summon_function_tags: new Settings.CheckboxSetting({
					id: 'animated_java:datapack_exporter/include_on_summon_function_tags',
					displayName: TRANSLATIONS.include_on_summon_function_tags.name,
					description: TRANSLATIONS.include_on_summon_function_tags.description,
					defaultValue: true,
					docsLink:
						'/docs/exporters/datapack_exporter/settings#include_on_summon_function_tags',
				}),
				include_on_remove_function_tags: new Settings.CheckboxSetting({
					id: 'animated_java:datapack_exporter/include_on_remove_function_tags',
					displayName: TRANSLATIONS.include_on_remove_function_tags.name,
					description: TRANSLATIONS.include_on_remove_function_tags.description,
					defaultValue: true,
					docsLink:
						'/docs/exporters/datapack_exporter/settings#include_on_remove_function_tags',
				}),
			}
		},
		settingsStructure: [
			{
				type: 'setting',
				settingId: 'animated_java:datapack_exporter/datapack_mcmeta',
			},
			{
				type: 'setting',
				settingId: 'animated_java:datapack_exporter/outdated_rig_warning',
			},
			{
				type: 'setting',
				settingId: 'animated_java:datapack_exporter/root_entity_nbt',
			},
			{
				type: 'setting',
				settingId: 'animated_java:datapack_exporter/use_component_system',
			},
			{
				type: 'group',
				title: TRANSLATIONS.function_toggles_group.title,
				openByDefault: false,
				children: [
					{
						type: 'setting',
						settingId:
							'animated_java:datapack_exporter/include_variant_summon_functions',
					},
					{
						type: 'setting',
						settingId:
							'animated_java:datapack_exporter/include_apply_variant_functions',
					},
					{
						type: 'setting',
						settingId: 'animated_java:datapack_exporter/include_uninstall_function',
					},
					{
						type: 'setting',
						settingId:
							'animated_java:datapack_exporter/include_pause_all_animations_function',
					},
					{
						type: 'setting',
						settingId: 'animated_java:datapack_exporter/include_remove_rigs_function',
					},
					{
						type: 'setting',
						settingId: 'animated_java:datapack_exporter/include_remove_all_function',
					},
				],
			},
			{
				type: 'group',
				title: TRANSLATIONS.function_tag_toggles_group.title,
				openByDefault: false,
				children: [
					{
						type: 'setting',
						settingId: 'animated_java:datapack_exporter/include_on_load_function_tags',
					},
					{
						type: 'setting',
						settingId: 'animated_java:datapack_exporter/include_on_tick_function_tags',
					},
					{
						type: 'setting',
						settingId:
							'animated_java:datapack_exporter/include_on_summon_function_tags',
					},
					{
						type: 'setting',
						settingId:
							'animated_java:datapack_exporter/include_on_remove_function_tags',
					},
				],
			},
		],
		export: generateDatapack as any,
	})
}
