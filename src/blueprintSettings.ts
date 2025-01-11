import { type MinecraftVersion } from './systems/datapackCompiler/mcbFiles'
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
	target_minecraft_version: '1.21.2' as MinecraftVersion,
	// Resource Pack Settings
	display_item: 'minecraft:white_dye',
	custom_model_data_offset: 0,
	enable_advanced_resource_pack_settings: false,
	resource_pack: '',
	// Data Pack Settings
	enable_advanced_data_pack_settings: false,
	data_pack: '',
	summon_commands: '',
	ticking_commands: '',
	interpolation_duration: 1,
	teleportation_duration: 1,
	use_storage_for_animation: false,
	show_function_errors: true,
	show_outdated_warning: true,
	// Plugin Settings
	baked_animations: true,
	json_file: '',
}

export const blueprintSettingErrors = new Valuable<Record<string, string>>({})
