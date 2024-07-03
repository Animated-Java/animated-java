import { Valuable } from './util/stores'

export type ExportMode = 'raw' | 'zip' | 'none'

export const defaultValues = {
	export_namespace: 'blueprint',
	show_bounding_box: false,
	auto_bounding_box: true,
	bounding_box: [48, 48],
	// Export Settings
	enable_plugin_mode: false,
	resource_pack_export_mode: 'raw' as ExportMode,
	data_pack_export_mode: 'raw' as ExportMode,
	// Resource Pack Settings
	display_item: 'minecraft:white_dye',
	customModelDataOffset: 0,
	enable_advanced_resource_pack_settings: false,
	resource_pack: '',
	display_item_path: '',
	model_folder: '',
	texture_folder: '',
	// Data Pack Settings
	enable_advanced_data_pack_settings: false,
	data_pack: '',
	summon_commands: '',
	interpolation_duration: 1,
	teleportation_duration: 1,
	use_storage_for_animation: false,
	// Plugin Settings
	baked_animations: true,
	json_file: '',
}

export const blueprintSettingErrors = new Valuable<Record<string, string>>({})
