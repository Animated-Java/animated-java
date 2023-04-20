// @ts-ignore
import en from '../lang/en.yaml'

export function loadTranslations() {
	const { addTranslations, translate } = AnimatedJava.API

	addTranslations('en', en as Record<string, string>)

	return {
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
		include_convenience_functions: {
			name: translate(
				'animated_java.datapack_exporter.settings.include_convenience_functions'
			),
			description: translate(
				'animated_java.datapack_exporter.settings.include_convenience_functions.description'
			).split('\n'),
		},
		// enable_single_rig_optimizations: {
		// 	name: translate(
		// 		'animated_java.datapack_exporter.settings.enable_single_rig_optimizations'
		// 	),
		// 	description: translate(
		// 		'animated_java.datapack_exporter.settings.enable_single_rig_optimizations.description'
		// 	).split('\n'),
		// },
		root_entity_nbt: {
			name: translate('animated_java.datapack_exporter.settings.root_entity_nbt'),
			description: translate(
				'animated_java.datapack_exporter.settings.root_entity_nbt.description'
			).split('\n'),
		},
	}
}
