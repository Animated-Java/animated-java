import { SUPPORTED_MINECRAFT_VERSIONS } from '../../systems/global'
import { Valuable } from '../../util/stores'

export type ExportMode = 'folder' | 'zip' | 'none'

export interface BlueprintSettings {
	export_namespace: string

	show_render_box: boolean
	auto_render_box: boolean
	render_box: ArrayVector2
	// Export Settings
	enable_plugin_mode: boolean
	resource_pack_export_mode: ExportMode
	data_pack_export_mode: ExportMode
	target_minecraft_version: SUPPORTED_MINECRAFT_VERSIONS
	// Resource Pack Settings
	display_item: string
	custom_model_data_offset: number
	enable_advanced_resource_pack_settings: boolean
	resource_pack: string
	// Data Pack Settings
	enable_advanced_data_pack_settings: boolean
	data_pack: string
	on_summon_function: string
	on_remove_function: string
	on_pre_tick_function: string
	on_post_tick_function: string
	interpolation_duration: number
	teleportation_duration: number
	auto_update_rig_orientation: boolean
	use_storage_for_animation: boolean
	// Plugin Settings
	baked_animations: boolean
	json_file: string
}

export const defaultValues: BlueprintSettings = {
	export_namespace: 'blueprint',

	show_render_box: false,
	auto_render_box: true,
	render_box: [48, 48] as ArrayVector2,

	// Export Settings
	enable_plugin_mode: false,
	resource_pack_export_mode: 'folder' as ExportMode,
	data_pack_export_mode: 'folder' as ExportMode,
	target_minecraft_version: SUPPORTED_MINECRAFT_VERSIONS['1.21.11'],

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
