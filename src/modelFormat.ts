export const codec = new Blockbench.Codec('ajmodel', {
	load_filter: {
		extensions: ['ajmodel', 'mcmodel'],
		type: 'json',
	},
	extension: 'ajmodel',
	remember: true,
	name: 'Animated Java Model',

	export() {
		Blockbench.export(
			{
				resource_id: 'model',
				type: this.name,
				extensions: ['ajmodel', 'mcmodel'],
				name: this.fileName!(),
				startpath: this.startPath!(),
				content: isApp ? undefined : this.compile!(),
				custom_writer: isApp
					? (content, path) => {
							// Path needs to be changed before compiling for relative resource paths
							Project!.save_path = path
							content = this.compile!()
							this.write!(content, path)
					  }
					: undefined,
			},
			path => this.afterDownload!(path)
		)
	},
	load(model, file, add) {
		setupProject(ajModelFormat)

		var name = pathToName(file.path, true)
		if (file.path && isApp && !file.no_file) {
			let project = Project
			Project!.save_path = file.path
			Project!.name = pathToName(name, false)
			addRecentProject({
				name,
				path: file.path,
				icon: 'icon-blockbench_file',
			})
			setTimeout(() => {
				if (Project == project) updateRecentProjectThumbnail()
			}, 200)
		}
		this.parse!(model, file.path)
	},
	compile(options): string | ArrayBuffer {
		return ''
	},
	parse(data, path) {},
	fileName() {
		return Project?.name || 'unnamed_ajmodel'
	},
})

export const ajModelFormat = new Blockbench.ModelFormat({
	id: 'animatedJava/ajmodel',
	icon: 'icon-armor_stand',
	name: 'Animated Java Model',
	description: 'The Animated Java model format.',
	category: 'minecraft',
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
