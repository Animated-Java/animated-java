import { PACKAGE } from './constants'
import { addProjectToRecentProjects } from './util/misc'

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
		box_uv: boolean
		backup: boolean
	}
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

	resolution: {
		width: number
		height: number
	}

	elements: any[]
	outliner: any[]
	textures: Texture[]
	animations: AnimationOptions[]
	animation_controllers: AnimationControllerOptions[]
	animation_variable_placeholders: string
	backgrounds: Record<string, any>
	history: any[]
	history_index: number
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
	load(model: IBlueprintFormatJSON, file) {
		console.log(`Loading Animated Java Blueprint from '${file.name}'...`)
		setupProject(BLUEPRINT_FORMAT, model.meta.uuid)
		if (!Project) {
			throw new Error('Failed to load Animated Java Blueprint')
		}
		addProjectToRecentProjects(file)
		BLUEPRINT_CODEC.parse!(model, file.path)
		console.log(`Successfully loaded Animated Java Blueprint`)
	},

	// ANCHOR - Codec:parse
	// Takes the model file and injects it's data into the global Project
	parse(model: IBlueprintFormatJSON, path) {
		console.log(`Parsing Animated Java Blueprint from '${path}'...`)
		if (!Project) throw new Error('No project to parse into')

		if (model.meta.uuid !== undefined) {
			Project.uuid = model.meta.uuid
		}

		if (ModelProject.all.find(p => p.uuid === model.meta.uuid)) {
			Project.uuid = guid()
		}

		if (model.meta.box_uv !== undefined) {
			Project.box_uv = model.meta.box_uv
		}

		if (model.resolution !== undefined) {
			Project.texture_width = model.resolution.width
			Project.texture_height = model.resolution.height
		}

		// Misc Project Properties
		for (const key in ModelProject.properties) {
			ModelProject.properties[key].merge(Project, model)
		}

		if (model.textures) {
			for (const texture of model.textures) {
				const newTexture = new Texture(texture, texture.uuid).add(false)
				if (texture.relative_path && Project.save_path) {
					const resolvedPath = PathModule.resolve(
						Project.save_path,
						texture.relative_path
					)
					if (fs.existsSync(resolvedPath)) {
						newTexture.fromPath(resolvedPath)
					}
				} else if (texture.path && fs.existsSync(texture.path) && !model.meta.backup) {
					newTexture.fromPath(texture.path)
				} else if (texture.source && texture.source.startsWith('data:')) {
					newTexture.fromDataURL(texture.source)
				}
			}
		}

		if (model.elements) {
			const defaultTexture = Texture.getDefault()
			for (const element of model.elements) {
				const newElement = OutlinerElement.fromSave(element, true) as Cube
				for (const face in newElement.faces) {
					if (element.faces) {
						const texture =
							element.faces[face].texture !== undefined &&
							Texture.all[element.faces[face].texture]
						if (texture) {
							newElement.faces[face].texture = texture.uuid
						}
					} else if (
						defaultTexture &&
						newElement.faces &&
						newElement.faces[face].texture !== undefined
					) {
						newElement.faces[face].texture = defaultTexture.uuid
					}
				}
			}
		}

		if (model.outliner) {
			parseGroups(model.outliner)
		}

		if (model.animations) {
			for (const animation of model.animations) {
				const newAnimation = new Blockbench.Animation()
				newAnimation.uuid = animation.uuid || guid()
				newAnimation.extend(animation)
				newAnimation.saved_name = animation.name
			}
		}

		if (model.animation_controllers) {
			for (const controller of model.animation_controllers) {
				const newController = new Blockbench.AnimationController()
				newController.uuid = controller.uuid || guid()
				newController.extend(controller)
				newController.saved_name = controller.name!
			}
		}

		if (model.animation_variable_placeholders) {
			Interface.Panels.variable_placeholders.inside_vue._data.text =
				model.animation_variable_placeholders
		}

		if (model.backgrounds) {
			for (const key in model.backgrounds) {
				if (Object.hasOwn(Project.backgrounds, key)) {
					const store = model.backgrounds[key]
					const real = Project.backgrounds[key]

					if (store.image !== undefined) {
						real.image = store.image
					}
					if (store.size !== undefined) {
						real.size = store.size
					}
					if (store.x !== undefined) {
						real.x = store.x
					}
					if (store.y !== undefined) {
						real.y = store.y
					}
					if (store.lock !== undefined) {
						real.lock = store.lock
					}
				}
			}
			Preview.all.forEach(p => {
				if (p.canvas.isConnected) {
					p.loadBackground()
				}
			})
		}

		if (model.history) {
			Undo.history = model.history.slice()
			Undo.index = model.history_index || 0
		}

		Canvas.updateAllBones()
		Canvas.updateAllPositions()
		Validator.validate()
	},

	// ANCHOR - Codec:compile
	compile(options) {
		if (!options) options = {}
		console.log(`Compiling Animated Java Blueprint from ${Project!.name}...`)
		if (!Project) throw new Error('No project to compile.')

		const model = {
			meta: {
				format: BLUEPRINT_FORMAT.id,
				format_version: PACKAGE.version,
				uuid: Project.uuid,
			},
			resolution: {
				width: Project.texture_width || 16,
				height: Project.texture_height || 16,
			},
		} as IBlueprintFormatJSON

		for (const key in ModelProject.properties) {
			if (ModelProject.properties[key].export)
				ModelProject.properties[key].copy(Project, model)
		}

		model.elements = []
		for (const element of elements) {
			model.elements.push(element.getSaveCopy && element.getSaveCopy(!!model.meta))
		}

		model.outliner = compileGroups(true)

		model.textures = []
		for (const texture of Texture.all) {
			const save = texture.getUndoCopy()
			delete save.selected
			if (Project.save_path && texture.path) {
				const relative = PathModule.relative(Project.save_path, texture.path)
				texture.relative_path = relative.replace(/\\/g, '/')
			}
			save.source = 'data:image/png;base64,' + texture.getBase64()
			save.mode = 'bitmap'
			if (options.absolute_paths === false) delete save.path
			model.textures.push(save)
		}

		model.animations = []
		const animationOptions = { bone_names: true, absolute_paths: options.absolute_paths }
		for (const animation of Blockbench.Animation.all) {
			if (!animation.getUndoCopy) continue
			model.animations.push(animation.getUndoCopy(animationOptions, true))
		}

		if (Interface.Panels.variable_placeholders.inside_vue._data.text) {
			model.animation_variable_placeholders =
				Interface.Panels.variable_placeholders.inside_vue._data.text
		}

		if (!options.backup) {
			const backgrounds: Record<string, any> = {}
			for (const key in Project.backgrounds) {
				const scene = Project.backgrounds[key]
				if (scene.image) {
					backgrounds[key] = scene.getSaveCopy()
				}
			}
			if (Object.keys(backgrounds).length) {
				model.backgrounds = backgrounds
			}
		}

		if (options.history) {
			model.history = []
			Undo.history.forEach(h => {
				const e = {
					before: omitKeys(h.before, ['aspects']),
					post: omitKeys(h.post, ['aspects']),
					action: h.action,
					time: h.time,
				}
				model.history.push(e)
			})
			model.history_index = Undo.index
		}

		return options.raw ? model : compileJSON(model)
	},

	// ANCHOR - Codec:export
	export() {
		console.log(`Exporting Animated Java Blueprint for ${Project!.name}...`)
		if (!Project) throw new Error('No project to export.')
		Blockbench.export({
			resource_id: 'animated_java_blueprint.export',
			type: 'json',
			extensions: [BLUEPRINT_CODEC.extension],
			content: BLUEPRINT_CODEC.compile(),
			// eslint-disable-next-line @typescript-eslint/naming-convention
			custom_writer: (content, path) => {
				BLUEPRINT_CODEC.write(content, path)
			},
		})
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
		Project.animated_java ??= {
			export_namespace: '',
			export_mode: '',
			// Resource Pack Settings
			display_item: '',
			enable_advanced_resource_pack_settings: false,
			resource_pack: '',
			// Data Pack Settings
			enable_advanced_data_pack_settings: false,
			data_pack: '',
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
