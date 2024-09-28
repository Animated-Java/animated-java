import { Valuable } from './util/stores'

export type ExportMode = 'folder' | 'zip' | 'none'
export type ExportEnvironment = 'vanilla' | 'plugin'
export type DataPackAnimationSystem = 'functions' | 'storage'

export const defaultValues = {
	id: 'animated_java:new_blueprint',
	show_bounding_box: false,
	auto_bounding_box: true,
	bounding_box: [48, 48],
	// Export Settings
	environment: 'vanilla' as ExportEnvironment,
	resource_pack_export_mode: 'folder' as ExportMode,
	data_pack_export_mode: 'folder' as ExportMode,
	// Resource Pack Settings
	custom_model_data_offset: 0,
	enable_advanced_resource_pack_settings: false,
	enable_advanced_resource_pack_folders: false,
	resource_pack: '',
	model_folder: '',
	texture_folder: '',
	// Data Pack Settings
	enable_advanced_data_pack_settings: false,
	data_pack: '',
	summon_commands: '',
	ticking_commands: '',
	interpolation_duration: 1,
	teleportation_duration: 1,
	animation_system: 'functions' as DataPackAnimationSystem,
	// Plugin Settings
	bake_animations: false,
	json_file: '',
}

export const blueprintSettingErrors = new Valuable<Record<string, string>>({})
