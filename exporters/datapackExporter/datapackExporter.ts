import { loadDataPackGenerator } from './exporter/datapackGen'
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
				include_convenience_functions: new Settings.CheckboxSetting({
					id: 'animated_java:datapack_exporter/include_convenience_functions',
					displayName: TRANSLATIONS.include_convenience_functions.name,
					description: TRANSLATIONS.include_convenience_functions.description,
					defaultValue: true,
					docsLink:
						'/docs/exporters/datapack_exporter/settings#include_convenience_functions',
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
				settingId: 'animated_java:datapack_exporter/include_convenience_functions',
			},
			{
				type: 'setting',
				settingId: 'animated_java:datapack_exporter/root_entity_nbt',
			},
		],
		export: loadDataPackGenerator() as any,
	})
}
