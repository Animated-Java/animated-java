declare interface ModelProject {
	animated_java: {
		export_namespace: string
		// Plugin Settings
		enable_plugin_mode: boolean
		// Resource Pack Settings
		enable_resource_pack: boolean
		display_item: string
		customModelDataOffset: number
		enable_advanced_resource_pack_settings: boolean
		resource_pack: string
		display_item_path: string
		model_folder: string
		texture_folder: string
		// Data Pack Settings
		enable_data_pack: boolean
		enable_advanced_data_pack_settings: boolean
		data_pack: string
	}
}

declare interface Group {
	inherit_settings: boolean
	enable_advanced_settings: boolean
	glowing: boolean
	glow_color: number
	shadow_radius: number
	shadow_strength: number
	brightness_override: number
	enchanted: boolean
	invisible: boolean
	nbt: string
}
