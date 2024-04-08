// @ts-ignore
import en from '../lang/en.yaml'
// @ts-ignore
import de from '../lang/de.yaml'
// @ts-ignore
import zh from '../lang/zh_cn.yaml'

export function loadTranslations() {
	const { addTranslations, translate } = AnimatedJava.API

	addTranslations('en', en as Record<string, string>)
	addTranslations('de', de as Record<string, string>)
	addTranslations('zh', zh as Record<string, string>)

	return {
		target_minecraft_version: {
			displayName: translate(
				'animated_java.datapack_exporter.settings.target_minecraft_version'
			),
			description: translate(
				'animated_java.datapack_exporter.settings.target_minecraft_version.description'
			).split('\n'),
		},
		datapack_mcmeta: {
			name: translate('animated_java.datapack_exporter.settings.datapack_mcmeta'),
			description: translate(
				'animated_java.datapack_exporter.settings.datapack_mcmeta.description'
			).split('\n'),
			error: {
				unset: translate(
					'animated_java.datapack_exporter.settings.datapack_mcmeta.error.unset'
				),
				invalid: translate(
					'animated_java.datapack_exporter.settings.datapack_mcmeta.error.invalid'
				),
			},
		},
		interpolation_duration: {
			name: translate('animated_java.datapack_exporter.settings.interpolation_duration'),
			description: translate(
				'animated_java.datapack_exporter.settings.interpolation_duration.description'
			).split('\n'),
		},
		enable_outdated_rig_warning: {
			name: translate('animated_java.datapack_exporter.settings.enable_outdated_rig_warning'),
			description: translate(
				'animated_java.datapack_exporter.settings.enable_outdated_rig_warning.description'
			).split('\n'),
		},
		use_component_system: {
			name: translate('animated_java.datapack_exporter.settings.use_component_system'),
			description: translate(
				'animated_java.datapack_exporter.settings.use_component_system.description'
			).split('\n'),
		},
		root_entity_nbt: {
			name: translate('animated_java.datapack_exporter.settings.root_entity_nbt'),
			description: translate(
				'animated_java.datapack_exporter.settings.root_entity_nbt.description'
			).split('\n'),
		},
		include_variant_summon_functions: {
			name: translate(
				'animated_java.datapack_exporter.settings.include_variant_summon_functions'
			),
			description: translate(
				'animated_java.datapack_exporter.settings.include_variant_summon_functions.description'
			).split('\n'),
		},
		include_apply_variant_functions: {
			name: translate(
				'animated_java.datapack_exporter.settings.include_apply_variant_functions'
			),
			description: translate(
				'animated_java.datapack_exporter.settings.include_apply_variant_functions.description'
			).split('\n'),
		},
		include_uninstall_function: {
			name: translate('animated_java.datapack_exporter.settings.include_uninstall_function'),
			description: translate(
				'animated_java.datapack_exporter.settings.include_uninstall_function.description'
			).split('\n'),
		},
		include_pause_all_animations_function: {
			name: translate(
				'animated_java.datapack_exporter.settings.include_pause_all_animations_function'
			),
			description: translate(
				'animated_java.datapack_exporter.settings.include_pause_all_animations_function.description'
			).split('\n'),
		},
		include_remove_rigs_function: {
			name: translate(
				'animated_java.datapack_exporter.settings.include_remove_rigs_function'
			),
			description: translate(
				'animated_java.datapack_exporter.settings.include_remove_rigs_function.description'
			).split('\n'),
		},
		include_remove_all_function: {
			name: translate('animated_java.datapack_exporter.settings.include_remove_all_function'),
			description: translate(
				'animated_java.datapack_exporter.settings.include_remove_all_function.description'
			).split('\n'),
		},
		function_toggles_group: {
			title: translate('animated_java.datapack_exporter.settings.function_toggles_group'),
		},
		include_on_load_function_tags: {
			name: translate(
				'animated_java.datapack_exporter.settings.include_on_load_function_tags'
			),
			description: translate(
				'animated_java.datapack_exporter.settings.include_on_load_function_tags.description'
			).split('\n'),
		},
		include_on_tick_function_tags: {
			name: translate(
				'animated_java.datapack_exporter.settings.include_on_tick_function_tags'
			),
			description: translate(
				'animated_java.datapack_exporter.settings.include_on_tick_function_tags.description'
			).split('\n'),
		},
		include_on_summon_function_tags: {
			name: translate(
				'animated_java.datapack_exporter.settings.include_on_summon_function_tags'
			),
			description: translate(
				'animated_java.datapack_exporter.settings.include_on_summon_function_tags.description'
			).split('\n'),
		},
		include_on_remove_function_tags: {
			name: translate(
				'animated_java.datapack_exporter.settings.include_on_remove_function_tags'
			),
			description: translate(
				'animated_java.datapack_exporter.settings.include_on_remove_function_tags.description'
			).split('\n'),
		},
		function_tag_toggles_group: {
			title: translate('animated_java.datapack_exporter.settings.function_tag_toggles_group'),
		},
	}
}
