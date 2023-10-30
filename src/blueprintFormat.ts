/**
 * The serialized Variant Bone Config
 */
interface IBlueprintVariantBoneConfigJSON {
	/**
	 * The uuid of the bone
	 */
	uuid: string
	/**
	 * Custom NBT for the bone that will be merged when this Variant is applied
	 */
	nbt: string
}

/**
 * The serialized Variant
 */
interface IBlueprintVariantJSON {
	/**
	 * The name of the Variant
	 */
	name: string
	/**
	 * The uuid of the Variant
	 */
	uuid: string
	/**
	 * The texture map for the Variant
	 */
	texture_map: Record<string, string>
	/**
	 * The bone configs that are modified in by the Variant
	 */
	bone_configs: Record<string, IBlueprintVariantBoneConfigJSON>
	/**
	 * The list of bones that should be ignored when applying the Variant
	 */
	excluded_bones: string[]
	/**
	 * Whether the excluded bones list is a whitelist or blacklist
	 */
	excluded_bones_is_whitelist: boolean
}

/**
 * The serialized Blueprint
 */
export interface IBlueprintFormatJSON {
	meta: {
		format: 'animated_java_blueprint'
		format_version: string
		uuid: string
	}
	/**
	 * Animated Java's Blueprint format metadata
	 */
	animated_java_blueprint: {
		/**
		 * The project settings of the Blueprint
		 */
		project_settings?: Record<string, any>
		/**
		 * The variants of the Blueprint
		 */
		variants: {
			/**
			 * The default Variant of the Blueprint
			 */
			default: IBlueprintVariantJSON
			/**
			 * The list of variants of the Blueprint, excluding the default Variant
			 */
			list: Record<string, IBlueprintVariantJSON>
		}
	}

	elements: any[]
	outliner: any[]
	textures: any[]
	animations: any[]

	animation_variable_placeholders: string
}

/**
 * The Animated Java Blueprint codec
 */
export const BLUEPRINT_CODEC = new Blockbench.Codec('animated_java_blueprint', {
	name: 'Animated Java Blueprint',
	extension: 'ajblueprint',
	remember: true,
	load_filter: {
		extensions: ['ajblueprint'],
		type: 'json',
	},

	// ANCHOR - Codec:load
	load(model, file) {
		if (!Project) return
		console.log(`Loading Animated Java Blueprint from '${file.name}'...`)
	},

	// ANCHOR - Codec:parse
	parse(model: IBlueprintFormatJSON, path) {
		if (!Project) return
		console.log(`Parsing Animated Java Blueprint from '${path}'...`)
	},

	// ANCHOR - Codec:compile
	compile(options) {
		if (!Project) return
		if (!options) options = {}
		console.log(`Compiling Animated Java Blueprint ${Project.name}...`)
		return ``
	},

	// ANCHOR - Codec:export
	export() {
		if (!Project) return
		console.log(`Exporting Animated Java Blueprint for ${Project.name}...`)
	},

	// ANCHOR - Codec:save
	fileName() {
		if (!Project || !Project.name) return 'unnamed_project.ajblueprint'
		return `${Project.name}.ajblueprint`
	},
})

/** ANCHOR
 * The Animated Java Blueprint format
 */
export const BLUEPRINT_FORMAT = new Blockbench.ModelFormat({
	id: 'animated_java_blueprint',
	name: 'Animated Java Blueprint',
	icon: 'icon-armor_stand',
	category: 'minecraft',
	target: 'Minecraft: Java Edition',
	confidential: false,
	condition: () => true,
	show_on_start_screen: true,
	format_page: {
		component: {
			methods: {},
			created() {
				console.log('Start screen created')
			},
			template: `Hello Animated Java World!`,
		},
	},

	onSetup() {
		if (!Project) return
		console.log('Animated Java Blueprint format setup')
		Project.animated_java = {
			export_mode: 'datapack_and_resourcepack',
		}
	},

	codec: BLUEPRINT_CODEC,

	box_uv: false,
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
	locators: true,
	rotation_limit: false,
	uv_rotation: true,
	java_face_properties: true,
	select_texture_for_particles: false,
	bone_binding_expression: true,
	animation_files: false,
	texture_folder: false,
	edit_mode: true,
	paint_mode: true,
	display_mode: false,
	animation_mode: true,
	pose_mode: false,
})
BLUEPRINT_CODEC.format = BLUEPRINT_FORMAT
