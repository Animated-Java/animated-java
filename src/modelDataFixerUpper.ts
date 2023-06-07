import { FORMAT_VERSION, IAnimatedJavaModel } from './modelFormat'
import { openUnexpectedErrorDialog } from './ui/popups/unexpectedError'

export function process(model: any) {
	if (model.meta.model_format === 'animatedJava/ajmodel') {
		model.meta.model_format = 'animated_java/ajmodel'
		model.meta.format_version = '0.0'
	}
	console.log('Processing model', JSON.parse(JSON.stringify(model)))

	const needsUpgrade = compareVersions(FORMAT_VERSION, model.meta.format_version)
	if (!needsUpgrade) return

	console.log('Upgrading model from version', model.meta.format_version, 'to', FORMAT_VERSION)

	try {
		console.group('Upgrade process')
		if (model.meta.format_version.length === 3) {
			if (compareVersions('1.0', model.meta.format_version)) updateModelTo1_0(model)
			if (compareVersions('1.1', model.meta.format_version)) updateModelTo1_1(model)
			if (compareVersions('1.2', model.meta.format_version)) updateModelTo1_2(model)
			if (compareVersions('1.3', model.meta.format_version)) updateModelTo1_3(model)
			if (compareVersions('1.4', model.meta.format_version)) updateModelTo1_4(model)
			model.meta.format_version = '0.3.9'
		}
		// Versions below this are post 0.3.10. I changed the versioning system to use the AJ version instead of a unique format version.
		if (compareVersions('0.3.10', model.meta.format_version)) updateModelTo0_3_10(model)
		console.groupEnd()
	} catch (e) {
		console.error(e)
		openUnexpectedErrorDialog(e)
		void Project?.close(true)
		return
	}

	model.meta.format_version = FORMAT_VERSION

	console.log('Upgrade complete')
}

// eslint-disable-next-line @typescript-eslint/naming-convention, @typescript-eslint/no-unused-vars
function updateModelTo0_3_10(model: any) {
	console.log('Processing model for AJ 0.3.10', JSON.parse(JSON.stringify(model)))
}

// eslint-disable-next-line @typescript-eslint/naming-convention
function updateModelTo1_4(model: any) {
	console.log('Processing model format 1.4', JSON.parse(JSON.stringify(model)))
	const exporter = model.animated_java.exporter_settings['animated_java:datapack_exporter']
	if (exporter && exporter.outdated_rig_warning !== undefined) {
		model.animated_java.exporter_settings[
			'animated_java:datapack_exporter'
		].enable_outdated_rig_warning =
			model.animated_java.exporter_settings[
				'animated_java:datapack_exporter'
			].outdated_rig_warning
		delete model.animated_java.exporter_settings['animated_java:datapack_exporter']
			.outdated_rig_warning
	}
}

// eslint-disable-next-line @typescript-eslint/naming-convention
function updateModelTo1_3(model: any) {
	console.log('Processing model format 1.3', JSON.parse(JSON.stringify(model)))
	if (model.animated_java.settings.exporter === 'animated_java:animation_exporter') {
		model.animated_java.settings.exporter = 'animated_java:datapack_exporter'
	}
	if (model.animated_java.exporter_settings['animated_java:animation_exporter']) {
		model.animated_java.exporter_settings['animated_java:datapack_exporter'] =
			model.animated_java.exporter_settings['animated_java:animation_exporter']
		delete model.animated_java.exporter_settings['animated_java:animation_exporter']
	}
}

// eslint-disable-next-line @typescript-eslint/naming-convention
function updateModelTo1_2(model: any) {
	console.log('Processing model format 1.2', JSON.parse(JSON.stringify(model)))
	for (const variant of model.animated_java.variants) {
		for (const [from, to] of Object.entries(variant.textureMap as Record<string, string>)) {
			const fromUUID = from.split('::')[0]
			const toUUID = to.split('::')[0]
			variant.textureMap[fromUUID] = toUUID
			delete variant.textureMap[from]
		}
	}
}

// eslint-disable-next-line @typescript-eslint/naming-convention
function updateModelTo1_1(model: any) {
	console.log('Processing model format 1.1', JSON.parse(JSON.stringify(model)))
	model.animated_java.settings.resource_pack_mcmeta =
		model.animated_java.settings.resource_pack_folder
	delete model.animated_java.settings.resource_pack_folder
	const animationExporterSettings =
		model.animated_java.exporter_settings['animated_java:animation_exporter']
	if (!animationExporterSettings) return
	animationExporterSettings.datapack_mcmeta = animationExporterSettings.datapack_folder
	delete animationExporterSettings.datapack_folder
}

// eslint-disable-next-line @typescript-eslint/naming-convention
function updateModelTo1_0(model: any) {
	console.log('Processing model format 1.0', JSON.parse(JSON.stringify(model)))
	if (model.meta.settings) {
		console.log('Upgrading settings...')
		const animatedJava: IAnimatedJavaModel['animated_java'] = {
			settings: {
				project_name: model.meta.settings.animatedJava.projectName,
				verbose: model.meta.settings.animatedJava.verbose,
				rig_item: model.meta.settings.animatedJava.rigItem,
				rig_item_model: model.meta.settings.animatedJava.predicateFilePath,
				rig_export_folder: model.meta.settings.animatedJava.rigModelsExportFolder,
			},
			exporter_settings: {},
			variants: [],
		} as IAnimatedJavaModel['animated_java']

		model.animated_java = animatedJava
	}

	if (model.meta.variants) {
		console.log('Upgrading variants...')
		const variants: IAnimatedJavaModel['animated_java']['variants'] = []

		for (const [name, variant] of Object.entries(model.meta.variants as Record<string, any>)) {
			variants.push({
				name,
				uuid: guid(),
				textureMap: variant,
				default: name === 'default',
				boneConfig: {},
				affectedBones: [],
				affectedBonesIsAWhitelist: false,
			})
		}

		model.animated_java.variants = variants
	}

	if (
		model.animations &&
		model.animations.find((a: any) =>
			Object.keys(a.animators as Record<string, any>).find(name => name === 'effects')
		)
	) {
		console.log('Upgrading effects...')

		for (const animation of model.animations) {
			const effects = animation.animators.effects
			if (!effects) continue
			for (const keyframe of effects.keyframes) {
				if (keyframe.channel !== 'timeline') continue
				for (const dataPoint of keyframe.data_points) {
					if (dataPoint.script) {
						dataPoint.commands = dataPoint.script
						delete dataPoint.script
						keyframe.channel = 'commands'
					}
				}
			}
		}

		console.log('Upgrading effects complete', model.animations)
	}

	model.meta.format_version = FORMAT_VERSION

	delete model.meta.variants
	delete model.meta.settings
	delete model.meta.uuid
}
