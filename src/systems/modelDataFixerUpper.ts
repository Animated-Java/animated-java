import { IBlueprintFormatJSON, getDefaultProjectSettings } from '../blueprintFormat'
import { BoneConfig } from '../boneConfig'
import { PACKAGE } from '../constants'
import { openUnexpectedErrorDialog } from '../interface/unexpectedErrorDialog'

export function process(model: any): any {
	if (model.meta.model_format === 'animatedJava/ajmodel') {
		model.meta.model_format = 'animated_java/ajmodel'
		model.meta.format_version = '0.0'
	}
	console.log('Processing model', JSON.parse(JSON.stringify(model)))

	try {
		let needsUpgrade = model.meta.format_version.length === 3
		needsUpgrade = needsUpgrade || compareVersions('1.0.0', model.meta.format_version)
		if (!needsUpgrade) return

		console.log(
			'Upgrading model from version',
			model.meta.format_version,
			'to',
			PACKAGE.version
		)

		console.group('Upgrade process')
		if (model.meta.format_version.length === 3) {
			if (compareVersions('1.0', model.meta.format_version)) updateModelToOld1_0(model)
			if (compareVersions('1.1', model.meta.format_version)) updateModelToOld1_1(model)
			if (compareVersions('1.2', model.meta.format_version)) updateModelToOld1_2(model)
			if (compareVersions('1.3', model.meta.format_version)) updateModelToOld1_3(model)
			if (compareVersions('1.4', model.meta.format_version)) updateModelToOld1_4(model)
			model.meta.format_version = '0.3.9'
		}
		// Versions below this are post 0.3.10. I changed the versioning system to use the AJ version instead of a unique format version.
		if (compareVersions('0.3.10', model.meta.format_version)) updateModelTo0_3_10(model)
		if (compareVersions('1.0.0', model.meta.format_version)) model = updateModelTo1_0(model)
		console.groupEnd()

		model.meta.format_version = PACKAGE.version
		console.log('Upgrade complete')
		return model
	} catch (e: any) {
		console.error(e)
		openUnexpectedErrorDialog(e as Error)
	}
}

// eslint-disable-next-line @typescript-eslint/naming-convention, @typescript-eslint/no-unused-vars
function updateModelTo0_3_10(model: any) {
	console.log('Processing model for AJ 0.3.10', JSON.parse(JSON.stringify(model)))
}

// eslint-disable-next-line @typescript-eslint/naming-convention
function updateModelToOld1_4(model: any) {
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
function updateModelToOld1_0(model: any) {
	console.log('Processing model format 1.0', JSON.parse(JSON.stringify(model)))
	if (model.meta.settings) {
		console.log('Upgrading settings...')
		const animatedJava: any = {
			settings: {
				project_name: model.meta.settings.animatedJava.projectName,
				verbose: model.meta.settings.animatedJava.verbose,
				rig_item: model.meta.settings.animatedJava.rigItem,
				rig_item_model: model.meta.settings.animatedJava.predicateFilePath,
				rig_export_folder: model.meta.settings.animatedJava.rigModelsExportFolder,
			},
			exporter_settings: {},
			variants: [],
		}

		model.animated_java = animatedJava
	}

	if (model.meta.variants) {
		console.log('Upgrading variants...')
		const variants: any[] = []

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

	model.meta.format_version = PACKAGE.version

	delete model.meta.variants
	delete model.meta.settings
	delete model.meta.uuid
}

// eslint-disable-next-line @typescript-eslint/naming-convention
function updateModelToOld1_1(model: any) {
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
function updateModelToOld1_2(model: any) {
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
function updateModelToOld1_3(model: any) {
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
function updateModelTo1_0(model: any) {
	const defaultSettings = getDefaultProjectSettings()
	const datapackExporterSettings =
		model.animated_java.exporter_settings['animated_java:datapack_exporter']

	const defaultVariant = model.animated_java.variants.find((v: any) => !!v.default)
	const variants = model.animated_java.variants.filter((v: any) => !v.default)

	const blueprint: IBlueprintFormatJSON = {
		meta: {
			format: 'animated_java_blueprint',
			format_version: PACKAGE.version,
			uuid: model.meta.uuid || guid(),
			last_used_export_namespace: model.animated_java.settings.project_namespace,
		},
		project_settings: {
			// Blueprint Settings
			show_bounding_box: defaultSettings.show_bounding_box,
			auto_bounding_box: defaultSettings.auto_bounding_box,
			bounding_box: defaultSettings.bounding_box,
			// Export settings
			export_namespace: model.animated_java.settings.project_namespace,
			enable_plugin_mode: defaultSettings.enable_plugin_mode,
			enable_resource_pack: defaultSettings.enable_resource_pack,
			enable_data_pack: defaultSettings.enable_data_pack,
			// Resource pack settings
			display_item: model.animated_java.settings.rig_item,
			customModelDataOffset: 0,
			enable_advanced_resource_pack_settings:
				model.animated_java.settings.enable_advanced_resource_pack_settings,
			resource_pack: model.animated_java.settings.resource_pack_mcmeta.replace(
				/\.mcmeta$/,
				''
			),
			display_item_path: model.animated_java.settings.rig_item_model,
			model_folder: model.animated_java.settings.rig_export_folder,
			texture_folder: model.animated_java.settings.texture_export_folder,
			// Data pack settings
			enable_advanced_data_pack_settings: defaultSettings.enable_advanced_data_pack_settings,
			data_pack: datapackExporterSettings.datapack_mcmeta.replace(/\.mcmeta$/, ''),
			summon_commands: defaultSettings.summon_commands,
			interpolation_duration: defaultSettings.interpolation_duration,
			teleportation_duration: defaultSettings.teleportation_duration,
			use_storage_for_animation: defaultSettings.use_storage_for_animation,
		},
		variants: {
			default: {
				name: 'default',
				display_name: defaultVariant.name || 'Default',
				uuid: defaultVariant.uuid || guid(),
				texture_map: defaultVariant.textureMap || {},
				excluded_bones: [],
			},
			list: [],
		},
		resolution: model.resolution,
		outliner: [],
		elements: model.elements,
		animations: model.animations,
		textures: model.textures,
		animation_variable_placeholders: model.animation_variable_placeholders,
	}

	const bones: string[] = []

	const recurseOutliner = (node: any) => {
		if (typeof node === 'string') return
		bones.push(node.uuid as string)
		node.configs = {
			default: new BoneConfig().toJSON(),
			variants: {},
		}
		node.children.forEach((child: any) => {
			if (typeof child === 'string') return
			recurseOutliner(child)
		})
		if (node.nbt && node.nbt !== '{}') {
			node.configs.default.use_nbt = true
			node.configs.default.nbt = node.nbt
			delete node.nbt
		}
	}

	model.outliner.forEach(recurseOutliner)
	blueprint.outliner = model.outliner

	for (const variant of variants) {
		const includedBones = variant.affectedBones.map((v: any) => v.value as string)
		let excludedBones: string[]
		if (variant.affectedBonesIsAWhitelist) {
			excludedBones = includedBones
		} else {
			excludedBones = bones.filter(b => !includedBones.includes(b))
		}

		blueprint.variants.list.push({
			name: variant.name,
			display_name: variant.name,
			uuid: variant.uuid,
			texture_map: variant.textureMap,
			excluded_bones: excludedBones,
		})
	}

	// Convert rig nbt into data merge command
	if (
		datapackExporterSettings.root_entity_nbt &&
		datapackExporterSettings.root_entity_nbt !== '{}'
	) {
		blueprint.project_settings!.summon_commands = `data merge entity @s ${
			datapackExporterSettings.root_entity_nbt as string
		}`
	}

	console.log('Finished Blueprint:', blueprint)
	return blueprint
}
