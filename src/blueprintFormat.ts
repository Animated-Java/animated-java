import ProjectTitleSvelteComponent from './components/projectTitle.svelte'
import { PACKAGE } from './constants'
import { injectSvelteCompomponent } from './util/injectSvelte'
import { addProjectToRecentProjects } from './util/misc'
import { Variant } from './variants'

/**
 * The serialized Variant Bone Config
 */
export interface IBlueprintVariantBoneConfigJSON {
	inherit_settings: boolean
	use_nbt: boolean
	glowing: boolean
	glow_color: string
	shadow_radius: number
	shadow_strength: number
	brightness_override: number
	enchanted: boolean
	invisible: boolean
	/**
	 * Custom NBT for the bone that will be merged when this Variant is applied
	 */
	nbt: string
}

/**
 * The serialized Variant Locator Config
 */
export interface IBlueprintVariantLocatorConfigJSON {
	entity_type: string
}

/**
 * The serialized Variant Camera Config
 */
export interface IBlueprintVariantCameraConfigJSON {
	entity_type: string
}

/**
 * The serialized Variant
 */
export interface IBlueprintVariantJSON {
	/**
	 * The display name of the Variant. Only use in Blockbench and for error messages.
	 */
	display_name: string
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
		save_location: string
	}
	/**
	 * The project settings of the Blueprint
	 */
	project_settings?: NonNullable<typeof Project>['animated_java']
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
		list: IBlueprintVariantJSON[]
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

		if (model.meta.save_location !== undefined) {
			Project.save_path = model.meta.save_location
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

		if (model.project_settings) {
			Project.animated_java = { ...Project.animated_java, ...model.project_settings }
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

		if (model.variants) {
			Variant.fromJSON(model.variants.default, true)
			for (const variantJSON of model.variants.list) {
				Variant.fromJSON(variantJSON)
			}
			Project.variants = Variant.all
		}

		if (model.animations) {
			for (const animation of model.animations) {
				const newAnimation = new Blockbench.Animation()
				newAnimation.uuid = animation.uuid || guid()
				newAnimation.extend(animation).add()
			}
		}

		if (model.animation_controllers) {
			for (const controller of model.animation_controllers) {
				const newController = new Blockbench.AnimationController()
				newController.uuid = controller.uuid || guid()
				newController.extend(controller).add()
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

		// if (model.history) {
		// 	Undo.history = model.history.slice()
		// 	Undo.index = model.history_index || 0
		// }

		Canvas.updateAll()
		Validator.validate()
		BLUEPRINT_CODEC.dispatchEvent('parsed', { model })
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
				save_location: Project.save_path,
			},
			project_settings: Project.animated_java,
			resolution: {
				width: Project.texture_width || 16,
				height: Project.texture_height || 16,
			},
		} as IBlueprintFormatJSON

		console.log(Project.animated_java)

		// Disable variants while compiling
		const previouslySelectedVariant = Variant.selected
		Variant.selectDefault()

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

		model.variants = {
			default: Variant.all.find(v => v.isDefault)!.toJSON(),
			list: Variant.all.filter(v => !v.isDefault).map(v => v.toJSON()),
		}

		model.animations = []
		const animationOptions = { bone_names: true, absolute_paths: options.absolute_paths }
		for (const animation of Blockbench.Animation.all) {
			if (!animation.getUndoCopy) continue
			model.animations.push(animation.getUndoCopy(animationOptions, true))
		}

		model.animation_controllers = []
		for (const controller of Blockbench.AnimationController.all) {
			if (!controller.getUndoCopy) continue
			model.animation_controllers.push(controller.getUndoCopy(animationOptions, true))
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

		previouslySelectedVariant?.select()

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

	// ANCHOR - Codec:fileName
	fileName() {
		if (!Project || !Project.name) return 'unnamed_project.ajblueprint'
		return `${Project.name}.ajblueprint`
	},
})

export function getDefaultProjectSettings(): ModelProject['animated_java'] {
	return {
		export_namespace: '',
		// Plugin Settings
		enable_plugin_mode: false,
		// Resource Pack Settings
		enable_resource_pack: true,
		display_item: '',
		customModelDataOffset: 0,
		enable_advanced_resource_pack_settings: false,
		resource_pack: '',
		display_item_path: '',
		model_folder: '',
		texture_folder: '',
		// Data Pack Settings
		enable_data_pack: true,
		enable_advanced_data_pack_settings: false,
		data_pack: '',
	}
}

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
			template: `<div>Hello Animated Java World!</div>`,
		},
	},

	onSetup(project, newModel) {
		if (!Project) return
		console.log('Animated Java Blueprint format setup')
		Project.animated_java ??= getDefaultProjectSettings()

		Project.variants ??= []
		if (newModel) {
			new Variant('Default', true)
		}
		// Remove the default title
		requestAnimationFrame(() => {
			const element = document.querySelector('#tab_bar_list .icon-armor_stand.icon')
			element?.remove()
		})
		// Custom title
		injectSvelteCompomponent({
			elementFinder: () => {
				const titles = [...document.querySelectorAll('.project_tab.selected')]
				titles.filter(title => title.textContent === Project.name)
				if (titles.length) {
					return titles[0]
				}
			},
			prepend: true,
			svelteComponent: ProjectTitleSvelteComponent,
			svelteComponentProperties: { project: Project },
		})

		requestAnimationFrame(() => {
			Variant.selectDefault()
		})
	},

	codec: BLUEPRINT_CODEC,

	animated_textures: true,
	animation_controllers: true,
	animation_files: true,
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
	rotate_cubes: true,
	rotation_limit: false,
	select_texture_for_particles: false,
	single_texture: false,
	texture_folder: false,
	texture_meshes: false,
	uv_rotation: true,
	vertex_color_ambient_occlusion: true,
})
BLUEPRINT_CODEC.format = BLUEPRINT_FORMAT

export function isCurrentFormat() {
	return Format.id === BLUEPRINT_FORMAT.id
}
