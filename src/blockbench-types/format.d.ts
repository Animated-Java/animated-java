interface FormatOptions {
	id: string
	icon: string
	name?: string
	description?: string
	show_on_start_screen?: boolean

	box_uv?: boolean
	meshes?: boolean
	optional_box_uv?: boolean
	single_texture?: boolean
	animated_textures?: boolean
	bone_rig?: boolean
	centered_grid?: boolean
	rotate_cubes?: boolean
	integer_size?: boolean
	locators?: boolean
	canvas_limit?: boolean
	rotation_limit?: boolean
	uv_rotation?: boolean
	display_mode?: boolean
	animation_mode?: boolean

	codec?: Codec
	onActivation?(): void
	onDeactivation?(): void
}

declare class ModelFormat extends Deletable {
	constructor(options: FormatOptions)

	id: string
	icon: string
	name?: string
	description?: string
	show_on_start_screen?: boolean

	box_uv: boolean
	meshes: boolean
	optional_box_uv: boolean
	single_texture: boolean
	animated_textures: boolean
	bone_rig: boolean
	centered_grid: boolean
	rotate_cubes: boolean
	integer_size: boolean
	locators: boolean
	canvas_limit: boolean
	rotation_limit: boolean
	uv_rotation: boolean
	display_mode: boolean
	animation_mode: boolean

	/**
	 * Selects the format
	 */
	select(): void
	/**
	 * Creates a new model using the format. Returns false if the user clicks cancel in the 'Unsaved Changes' dialog, returns true when successful.
	 */
	new(): boolean
	/**
	 * Convert project to this format
	 */
	convertTo(): void
}

/**
 * The current format
 */
declare const Format: ModelFormat
