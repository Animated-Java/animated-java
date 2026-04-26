import { NbtCompound, NbtList, NbtString, NbtTag } from 'deepslate/lib/nbt'
import { getDefaultProjectSettings } from '..'
import { DisplayEntityConfig } from '../../../nodeConfigs'

export default function upgrade(model: any) {
	console.log('Processing model format 1.0.0-pre1', model)

	const defaultSettings = getDefaultProjectSettings()
	const datapackExporterSettings =
		model.animated_java.exporter_settings['animated_java:datapack_exporter']

	const defaultVariant = model.animated_java.variants.find((v: any) => !!v.default)
	const blueprint: Record<string, any> = {
		meta: {
			format: 'animated_java_blueprint',
			format_version: '0.5.0',
			uuid: model.meta.uuid ?? guid(),
			last_used_export_namespace: model.animated_java.settings.project_namespace,
		},
		project_settings: {
			// Blueprint Settings
			show_bounding_box: defaultSettings.show_render_box,
			auto_bounding_box: defaultSettings.auto_render_box,
			bounding_box: defaultSettings.render_box,
			// Export settings
			export_namespace: model.animated_java.settings.project_namespace,
			enable_plugin_mode: defaultSettings.enable_plugin_mode,
			resource_pack_export_mode: defaultSettings.resource_pack_export_mode,
			data_pack_export_mode: defaultSettings.data_pack_export_mode,
			// Resource pack settings
			display_item: model.animated_java.settings.rig_item,
			custom_model_data_offset: 0,
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
			summon_commands: defaultSettings.on_summon_function,
			interpolation_duration: defaultSettings.interpolation_duration,
			teleportation_duration: defaultSettings.teleportation_duration,
			use_storage_for_animation: defaultSettings.use_storage_for_animation,
			// Plugin settings
			baked_animations: defaultSettings.baked_animations,
			json_file: defaultSettings.json_file,
		},
		variants: {
			default: {
				name: 'default',
				display_name: defaultVariant.name ?? 'Default',
				uuid: defaultVariant.uuid ?? guid(),
				texture_map: defaultVariant.textureMap ?? {},
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
			default: new DisplayEntityConfig().toJSON(),
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

	for (const element of blueprint.elements ?? []) {
		if (element.type === 'locator') {
			element.config = {
				use_entity: true,
			}
			if (element.entity_type) element.config.entity_type = element.entity_type
			if (element.nbt) {
				const summonCommands: string[] = []
				const nbt = NbtTag.fromString(element.nbt as string) as NbtCompound
				nbt.delete('Passengers')
				const tags = (nbt.get('Tags') as NbtList<NbtString>)?.map(t => t.getAsString())
				nbt.delete('Tags')
				summonCommands.push('data merge entity @s ' + nbt.toString())
				if (tags) summonCommands.push(...tags.map(t => `tag @s add ${t}`))

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
					summonCommands.push(...recursePassengers(element.nbt as string))
				} catch (e) {
					console.error('Failed to parse NBT', element.nbt)
					console.error(e)
				}
				if (summonCommands.length === 0) {
					summonCommands.push(`data merge entity @s ${element.nbt as string}`)
				}

				element.config.summon_commands = summonCommands.join('\n')
			}
		}
	}

	const variants = model.animated_java?.variants?.filter((v: any) => !v.default) ?? []
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
			excluded_nodes: excludedBones,
		})
	}

	// The Effects animator commands to locator commands code has been removed as 1.4.0 supports effect commands keyframes natively again.

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

	return blueprint
}
