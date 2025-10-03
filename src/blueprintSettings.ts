import type { MinecraftVersion } from './systems/global'
import { Valuable } from './util/stores'

export type ExportMode = 'folder' | 'zip' | 'none'

export const defaultValues = {
	export_namespace: 'blueprint',

	show_render_box: false,
	auto_render_box: true,
	render_box: [48, 48] as ArrayVector2,

	// Export Settings
	enable_plugin_mode: false,
	resource_pack_export_mode: 'folder' as ExportMode,
	data_pack_export_mode: 'folder' as ExportMode,
	target_minecraft_version: '1.21.5' as MinecraftVersion,

	// Resource Pack Settings
	display_item: 'minecraft:white_dye',
	custom_model_data_offset: 0,
	enable_advanced_resource_pack_settings: false,
	resource_pack: '',

	// Data Pack Settings
	enable_advanced_data_pack_settings: false,
	data_pack: '',

	on_summon_function: '',
	on_remove_function: '',
	on_pre_tick_function: '',
	on_post_tick_function: '',

	interpolation_duration: 1,
	teleportation_duration: 1,

	auto_update_rig_orientation: true,
	use_storage_for_animation: false,

	// Plugin Settings
	baked_animations: true,
	json_file: '',
}

export const blueprintSettingErrors = new Valuable<Record<string, string>>({})
