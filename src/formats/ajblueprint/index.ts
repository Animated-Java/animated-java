import { AJBLUEPRINT_CODEC } from './codec'

import './settings'

export const AJBLUEPRINT_FORMAT = new Blockbench.ModelFormat({
	id: 'animated-java:ajblueprint',
	name: 'Animated Java Blueprint',
	icon: 'icon-armor_stand',
	category: 'animated_java',
	target: 'Minecraft: Java Edition',
	confidential: false,
	show_on_start_screen: true,
	// Feature Flags
	animated_textures: true,
	animation_controllers: true,
	animation_files: true,
	texture_mcmeta: true,
	animation_mode: true,
	bone_binding_expression: true,
	bone_rig: true,
	box_uv: false,
	centered_grid: true,
	display_mode: false,
	edit_mode: true,
	integer_size: false,
	java_face_properties: true,
	locators: true,
	meshes: false,
	model_identifier: false,
	optional_box_uv: true,
	paint_mode: true,
	parent_model_id: false,
	pose_mode: false,
	render_sides: 'front',
	rotate_cubes: true,
	rotation_limit: false,
	select_texture_for_particles: false,
	single_texture: false,
	texture_folder: false,
	texture_meshes: false,
	uv_rotation: true,
	vertex_color_ambient_occlusion: true,
	java_cube_shading_properties: true,
	box_uv_float_size: false,
	cullfaces: true,
})

AJBLUEPRINT_FORMAT.codec = AJBLUEPRINT_CODEC
AJBLUEPRINT_CODEC.format = AJBLUEPRINT_FORMAT
