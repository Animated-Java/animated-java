const codec = new Codec('ajmodel', {
	load_filter: {
		extensions: ['ajmodel'],
		type: 'json',
	},
	extension: 'ajmodel',
	remember: true,
	id: 'animated_java/ajmodel',
	name: 'Animated Java Model',
	description: 'Model format that exports to animated java edition armor_stand animations',
	show_on_start_screen: true,
	bone_rig: true,
	animation_mode: true,
	canvas_limit: false,
	rotate_cubes: true,
	rotation_limit: true,
	animation_files: true,
	icon: 'fa-cube',
	export() {
		var scope = this
		Blockbench.export(
			{
				resource_id: 'model',
				type: scope.name,
				extensions: ['ajmodel', 'mcmodel'],
				name: scope.fileName!(),
				startpath: scope.startPath!(),
				content: scope.compile!()!,
				custom_writer: isApp ? (a, b) => scope.write!(a, b) : null!,
			},
			path => scope.afterDownload!(path)
		)
	},
	load(model: any, file: any) {},
	// @ts-ignore
	compile(compile: any) {},
	// @ts-ignore
	parse(model: any, path: any, add: any) {},
	fileName() {
		return Project?.name || 'my_ajmodel'
	},
})

const format = new ModelFormat({
	id: 'animated_java/ajmodel',
	icon: 'icon-armor_stand',
	name: 'Animated Java Model',
	description: 'Model format that exports to java edition armor_stand animations',
	category: 'Java',
	target: 'Minecraft: Java Edition',
	confidential: false,
	condition: () => true,
	show_on_start_screen: true,
	// format_page?: FormatPage
	onFormatPage() {},
	onStart() {},

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
