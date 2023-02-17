import * as pathjs from 'path'
import * as fs from 'fs'

const FORMAT_VERSION = '1.0'

function processHeader(model: any) {
	if (!model.meta.format_version) {
		model.meta.format_version = model.meta.format
	}
}

function processCompatibility(model: any) {
	if (model.cubes && !model.elements) {
		model.elements = model.cubes
	}
	if (model.geometry_name) model.model_identifier = model.geometry_name

	if (model.elements && model.meta.box_uv && compareVersions('4.5', model.meta.format_version)) {
		model.elements.forEach((element: any) => {
			if (element.shade === false) {
				element.mirror_uv = true
			}
		})
	}

	if (model.outliner) {
		if (compareVersions('3.2', model.meta.format_version)) {
			//Fix Z-axis inversion pre 3.2
			function iterate(list: any[]) {
				for (var child of list) {
					if (typeof child == 'object') {
						iterate(child.children)
						if (child.rotation) child.rotation[2] *= -1
					}
				}
			}
			iterate(model.outliner)
		}
	}
}

export const ajCodec = new Blockbench.Codec('ajmodel', {
	name: 'Animated Java Model',
	remember: true,
	extension: 'ajmodel',
	load_filter: {
		extensions: ['ajmodel', 'mcmodel'],
		type: 'json',
	},
	fileName() {
		return Project?.animated_java_settings!.project_name.pull().value
	},
	load(model, file, add) {
		Blockbench.Codec.prototype.load!.bind(ajCodec)(model, file, add)
	},
	compile(options) {
		const model = {}
		return compileJSON(model)
	},
})

export const ajModelFormat = new Blockbench.ModelFormat({
	id: 'animated_java/ajmodel',
	icon: 'icon-armor_stand',
	name: 'Animated Java Model',
	description: 'The Animated Java model format.',
	category: 'minecraft',
	target: 'Minecraft: Java Edition',
	confidential: false,
	condition: () => true,
	show_on_start_screen: true,
	format_page: {
		content: [{ type: 'h3', text: tl('animated_java.format_page.h3') }],
	},
	onStart() {},
	codec: ajCodec,

	box_uv: true,
	optional_box_uv: true,
	single_texture: false,
	model_identifier: false,
	parent_model_id: false,
	vertex_color_ambient_occlusion: true,
	animated_textures: true,
	bone_rig: true,
	centered_grid: true,
	rotate_cubes: true,
	integer_size: false,
	meshes: false,
	texture_meshes: false,
	locators: false,
	rotation_limit: false,
	uv_rotation: true,
	java_face_properties: true,
	select_texture_for_particles: false,
	bone_binding_expression: true,
	animation_files: false,
	texture_folder: true,
	edit_mode: true,
	paint_mode: true,
	display_mode: false,
	animation_mode: true,
	pose_mode: false,

	// cube_size_limiter: {
	// },
})
ajCodec.format = ajModelFormat
// FIXME Should actively convert old models as best it can to the new format
// Backwards compatability with old model format
// Formats['animatedJava/ajmodel'] = ajModelFormat
