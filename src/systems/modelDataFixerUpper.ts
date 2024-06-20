import { IBlueprintFormatJSON, getDefaultProjectSettings } from '../blueprintFormat'
import { BoneConfig } from '../nodeConfigs'
import { PACKAGE } from '../constants'
import { openUnexpectedErrorDialog } from '../interface/unexpectedErrorDialog'
import { NbtCompound, NbtList, NbtString, NbtTag } from 'deepslate'

export function process(model: any): any {
	if (model.meta.model_format === 'animatedJava/ajmodel') {
		model.meta.model_format = 'animated_java/ajmodel'
		model.meta.format_version = '0.0'
	}
	console.log('Processing model', JSON.parse(JSON.stringify(model)))

	try {
		let needsUpgrade = model.meta.format_version.length === 3
		needsUpgrade = needsUpgrade || compareVersions(PACKAGE.version, model.meta.format_version)
		if (!needsUpgrade) return

		console.log(
			'Upgrading model from version',
			model.meta.format_version,
			'to',
			PACKAGE.version
		)

		console.group('Upgrade process')
		if (model.meta.format_version.length === 3) {
			console.log('Processing old model format', JSON.parse(JSON.stringify(model)))
			if (compareVersions('1.0', model.meta.format_version)) updateModelToOld1_0(model)
			if (compareVersions('1.1', model.meta.format_version)) updateModelToOld1_1(model)
			if (compareVersions('1.2', model.meta.format_version)) updateModelToOld1_2(model)
			if (compareVersions('1.3', model.meta.format_version)) updateModelToOld1_3(model)
			if (compareVersions('1.4', model.meta.format_version)) updateModelToOld1_4(model)
			model.meta.format_version = '0.3.9'
		}
		// Versions below this are post 0.3.10. I changed the versioning system to use the AJ version instead of a unique format version.
		if (compareVersions('0.3.10', model.meta.format_version)) updateModelTo0_3_10(model)
		// Animated Java 1.0.0-pre1
		if (compareVersions('0.5.0', model.meta.format_version)) model = updateModelTo1_0pre1(model)
		console.groupEnd()

		model.meta.format_version = PACKAGE.version
		console.log('Upgrade complete')
		return model
	} catch (e: any) {
		openUnexpectedErrorDialog(e as Error)
		throw e
	}
}

// eslint-disable-next-line @typescript-eslint/naming-convention, @typescript-eslint/no-unused-vars
function updateModelTo0_3_10(model: any) {
	console.log('Processing model for AJ 0.3.10', JSON.parse(JSON.stringify(model)))
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
function updateModelTo1_0pre1(model: any) {
	console.log('Processing model format 1.0.0-pre1', JSON.parse(JSON.stringify(model)))

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
			resource_pack: model.animated_java.settings.resource_pack_mcmeta
				? model.animated_java.settings.resource_pack_mcmeta.replace(/pack\.mcmeta$/, '')
				: '',
			display_item_path: model.animated_java.settings.rig_item_model,
			model_folder: model.animated_java.settings.rig_export_folder,
			texture_folder: model.animated_java.settings.texture_export_folder,
			// Data pack settings
			enable_advanced_data_pack_settings: defaultSettings.enable_advanced_data_pack_settings,
			data_pack: datapackExporterSettings?.datapack_mcmeta
				? datapackExporterSettings.datapack_mcmeta.replace(/pack\.mcmeta$/, '')
				: '',
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

	for (const element of blueprint.elements) {
		if (element.type === 'locator') {
			element.config = {
				use_entity: true,
			}
			if (element.entity_type) element.config.entity_type = element.entity_type
			if (element.nbt) {
				const summon_commands: string[] = []
				const nbt = NbtTag.fromString(element.nbt as string) as NbtCompound
				nbt.delete('Passengers')
				const tags = (nbt.get('Tags') as NbtList<NbtString>)?.map(t => t.getAsString())
				nbt.delete('Tags')
				summon_commands.push('data merge entity @s ' + nbt.toString())
				if (tags) summon_commands.push(...tags.map(t => `tag @s add ${t}`))

				const recursePassengers = (stringNbt: string): string[] => {
					const nbt = NbtTag.fromString(stringNbt) as NbtCompound
					if (!(nbt instanceof NbtCompound)) throw new Error('NBT is not a compound')
					const passengers = nbt.get('Passengers') as NbtList<NbtCompound>
					if (passengers) {
						console.log('Found passengers')
						const commands = passengers.map(p => {
							const id = (p.get('id') as NbtString).getAsString()
							p.delete('id')
							const tags = (p.get('Tags') as NbtList<NbtString>).map(t =>
								t.getAsString()
							)
							p.delete('Tags')
							const data = p.toString()
							return `execute summon ${id} run {\n\t${[
								`data merge entity @s ${data}`,
								...tags.map(t => `tag @s add ${t}`),
								`tag @s add to_mount`,
								...recursePassengers(data),
							].join('\n\t')}\n}`
						})
						commands.push(
							`tag @s add vehicle`,
							`execute as @e[tag=to_mount,distance=..0.01] run {`,
							`\tride @s mount @e[tag=vehicle,limit=1]`,
							`\ttag @s remove to_mount`,
							`}`,
							`tag @s remove vehicle`,
							`execute on passengers run tag @s remove to_mount`
						)
						return commands
					}
					return []
				}

				try {
					summon_commands.push(...recursePassengers(element.nbt as string))
				} catch (e) {
					console.error('Failed to parse NBT', element.nbt)
					console.error(e)
				}
				if (summon_commands.length === 0) {
					summon_commands.push(`data merge entity @s ${element.nbt as string}`)
				}

				element.config.summon_commands = summon_commands.join('\n')
			}
		}
	}

	for (const variant of variants) {
		const includedBones = variant.affectedBones.map((v: any) => v.value as string)
		let excludedBones: string[]
		if (variant.affectedBonesIsAWhitelist) {
			excludedBones = bones.filter(b => !includedBones.includes(b))
		} else {
			excludedBones = includedBones
		}

		blueprint.variants.list.push({
			name: variant.name,
			display_name: variant.name,
			uuid: variant.uuid,
			texture_map: variant.textureMap,
			excluded_bones: excludedBones,
		})
	}

	const commandsLocator = new Locator({
		name: 'commands',
		from: [0, 0, 0],
	}).getSaveCopy!()
	let commandKeyframeCount = 0

	// Move command keyframes into commands channel on a "root" locator.
	if (blueprint.animations) {
		for (const animation of blueprint.animations) {
			if (animation.animators.effects) {
				for (const kf of animation.animators.effects.keyframes) {
					if (kf.channel === 'variants') kf.channel = 'variant'
				}
			}
			const keyframes: any[] = []
			const effects = animation.animators.effects
			if (!effects || !effects.keyframes) continue
			for (const keyframe of effects.keyframes) {
				if (
					!keyframe ||
					keyframe.channel !== 'commands' ||
					(keyframe.data_points && keyframe.data_points.length < 1)
				)
					continue

				for (const datapoint of keyframe.data_points) {
					if (!datapoint.commands) continue
					keyframes.push({
						...keyframe,
						data_points: [
							{
								commands: datapoint.commands,
								time: datapoint.time,
							},
						],
					})
				}
			}
			if (keyframes.length > 0) {
				animation.animators[commandsLocator.uuid] ??= {
					type: 'locator',
					name: 'commands',
					keyframes: [],
				}
				const animator = animation.animators[commandsLocator.uuid]
				for (const keyframe of keyframes) {
					// animator.addKeyframe(keyframe as KeyframeOptions)
					animator.keyframes.push(keyframe)
					commandKeyframeCount++
				}
			}
		}
	}
	if (commandKeyframeCount > 0) blueprint.elements.push(commandsLocator)

	// Convert rig nbt into data merge command
	if (
		datapackExporterSettings?.root_entity_nbt &&
		datapackExporterSettings.root_entity_nbt !== '{}'
	) {
		const commands: string[] = []
		const nbt = NbtTag.fromString(
			datapackExporterSettings.root_entity_nbt as string
		) as NbtCompound
		const tags = (nbt.get('Tags') as NbtList<NbtString>)?.map(t => t.getAsString())
		nbt.delete('Tags')
		if ([...nbt.keys()].length !== 0) commands.push('data merge entity @s ' + nbt.toString())
		if (tags) commands.push(...tags.map(t => `tag @s add ${t}`))
		blueprint.project_settings!.summon_commands = commands.join('\n')
	}

	console.log('Finished Blueprint:', blueprint)
	return blueprint
}
