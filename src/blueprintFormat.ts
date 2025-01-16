import * as blueprintSettings from './blueprintSettings'
import { BillboardMode, BoneConfig, LocatorConfig } from './nodeConfigs'
import ProjectTitleSvelte from './components/projectTitle.svelte'
import { PACKAGE } from './constants'
import { events } from './util/events'
import { injectSvelteCompomponent } from './util/injectSvelteComponent'
import { toSafeFuntionName } from './util/minecraftUtil'
import { addProjectToRecentProjects } from './util/misc'
import { Valuable } from './util/stores'
import { Variant } from './variants'
import FormatPageSvelte from './components/formatPage.svelte'
import { translate } from './util/translation'
import { process } from './systems/modelDataFixerUpper'

/**
 * The serialized Variant Bone Config
 */
export interface IBlueprintBoneConfigJSON {
	custom_name?: BoneConfig['customName']
	custom_name_visible?: BoneConfig['customNameVisible']
	billboard?: BoneConfig['billboard']
	override_brightness?: BoneConfig['overrideBrightness']
	brightness_override?: BoneConfig['brightnessOverride']
	enchanted?: BoneConfig['enchanted']
	glowing?: BoneConfig['glowing']
	override_glow_color?: BoneConfig['overrideGlowColor']
	glow_color?: BoneConfig['glowColor']
	inherit_settings?: BoneConfig['inheritSettings']
	invisible?: BoneConfig['invisible']
	/**
	 * Custom NBT for the bone that will be merged when this Variant is applied
	 */
	nbt?: BoneConfig['nbt']
	shadow_radius?: BoneConfig['shadowRadius']
	shadow_strength?: BoneConfig['shadowStrength']
	use_nbt?: BoneConfig['useNBT']
}

/**
 * The serialized Variant Locator Config
 */
export interface IBlueprintLocatorConfigJSON {
	use_entity?: LocatorConfig['useEntity']
	entity_type?: LocatorConfig['entityType']
	summon_commands?: LocatorConfig['_summonCommands']
	ticking_commands?: LocatorConfig['tickingCommands']
}

/**
 * The serialized Variant Camera Config
 */
export interface IBlueprintCameraConfigJSON {
	entity_type?: string
	nbt?: string
	ticking_commands?: string
}

/**
 * The serialized Variant Locator Config
 */
export interface IBlueprintTextDisplayConfigJSON {
	billboard?: BillboardMode
	override_brightness?: BoneConfig['overrideBrightness']
	brightness_override?: BoneConfig['brightnessOverride']
	glowing?: BoneConfig['glowing']
	override_glow_color?: BoneConfig['overrideGlowColor']
	glow_color?: BoneConfig['glowColor']
	invisible?: BoneConfig['invisible']
	shadow_radius?: BoneConfig['shadowRadius']
	shadow_strength?: BoneConfig['shadowStrength']
	use_nbt?: BoneConfig['useNBT']
	/**
	 * Custom NBT for the bone that will be merged when this Variant is applied
	 */
	nbt?: BoneConfig['nbt']
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
	 * The list of bones that should be ignored when applying the Variant
	 */
	excluded_nodes: string[]
	/**
	 * Whether or not this is the default Variant
	 */
	is_default?: true
}

/**
 * The serialized Blueprint
 */
export interface IBlueprintFormatJSON {
	meta: {
		format: 'animated_java_blueprint'
		format_version: string
		uuid: string
		last_used_export_namespace: string
		box_uv?: boolean
		backup?: boolean
		save_location?: string
	}
	/**
	 * The project settings of the Blueprint
	 */
	blueprint_settings?: NonNullable<typeof Project>['animated_java']
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
	animation_controllers?: AnimationControllerOptions[]
	animation_variable_placeholders: string
	backgrounds?: Record<string, any>
}

//region > Convert
export function convertToBlueprint() {
	// Convert the current project to a Blueprint
	Project!.save_path = ''

	for (const group of Group.all) {
		group.createUniqueName(Group.all.filter(g => g !== group))
		group.sanitizeName()
	}
	for (const animation of Blockbench.Animation.all) {
		animation.createUniqueName(Blockbench.Animation.all.filter(a => a !== animation))
		animation.name = toSafeFuntionName(animation.name)
	}
	for (const cube of Cube.all) {
		cube.setUVMode(false)
	}
}

export function getDefaultProjectSettings(): ModelProject['animated_java'] {
	return blueprintSettings.defaultValues
}

export function updateBoundingBox() {
	if (!Project || !isCurrentFormat()) return
	if (Project.visualBoundingBox) scene.remove(Project.visualBoundingBox)

	if (!Project.animated_java.show_bounding_box) return

	let width = 0
	let height = 0
	if (Project.animated_java.auto_bounding_box) {
		for (const cube of Cube.all) {
			width = Math.max(
				width,
				Math.abs(cube.to[0]),
				Math.abs(cube.to[2]),
				Math.abs(cube.from[0]),
				Math.abs(cube.from[2])
			)
			height = Math.max(height, cube.to[1], cube.from[1])
		}
		const boundingBoxOverflow = 8
		width += boundingBoxOverflow
		height += boundingBoxOverflow
	} else {
		width = Project.animated_java.bounding_box[0]
		height = Project.animated_java.bounding_box[1]
	}

	const boundingBox = new THREE.BoxGeometry(width * 2, height, width * 2)
	Project.visualBoundingBox = new THREE.LineSegments(
		new THREE.EdgesGeometry(boundingBox),
		new THREE.LineBasicMaterial({ color: '#855000' })
	)
	Project.visualBoundingBox.position.set(0, height / 2, 0)
	scene.add(Project.visualBoundingBox)
}

// region Codec
export const BLUEPRINT_CODEC = new Blockbench.Codec('animated_java_blueprint', {
	name: 'Animated Java Blueprint',
	extension: 'ajblueprint',
	remember: true,
	load_filter: {
		extensions: ['ajblueprint'],
		type: 'json',
	},

	// region > load
	load(model: IBlueprintFormatJSON, file) {
		console.log(`Loading Animated Java Blueprint from '${file.name}'...`)
		model = process(model)
		setupProject(BLUEPRINT_FORMAT, model.meta.uuid)
		if (!Project) {
			throw new Error('Failed to load Animated Java Blueprint')
		}
		addProjectToRecentProjects(file)
		BLUEPRINT_CODEC.parse!(model, file.path)
		console.log(
			`Successfully loaded Animated Java Blueprint\n\tProject: ${Project.name}\n\t${Project.uuid}`
		)
	},

	// region > parse
	// Takes the model file and injects it's data into the global Project
	parse(model: IBlueprintFormatJSON, path) {
		console.log(`Parsing Animated Java Blueprint from '${path}'...`)
		if (!Project) throw new Error('No project to parse into')

		Project.loadingPromises = []

		Project.save_path = path

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

		if (model.blueprint_settings) {
			Project.animated_java = { ...Project.animated_java, ...model.blueprint_settings }
		}

		Project.last_used_export_namespace =
			model.meta.last_used_export_namespace || Project.animated_java.export_namespace

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
						continue
					}
				}
				if (texture.path && fs.existsSync(texture.path) && !model.meta.backup) {
					newTexture.fromPath(texture.path)
				} else if (texture.source && texture.source.startsWith('data:')) {
					newTexture.fromDataURL(texture.source)
				}
			}
		}

		if (model.elements) {
			const defaultTexture = Texture.getDefault()
			for (const element of model.elements) {
				const newElement = OutlinerElement.fromSave(element, true)
				switch (true) {
					case newElement instanceof Cube: {
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
						break
					}
					case newElement instanceof AnimatedJava.API.TextDisplay:
					case newElement instanceof AnimatedJava.API.VanillaItemDisplay:
					case newElement instanceof AnimatedJava.API.VanillaBlockDisplay: {
						// ES-Lint doesn't like the types here for some reason, so I'm casing them to please it.
						Project.loadingPromises.push(newElement.waitForReady() as Promise<void>)
						break
					}
				}
			}
		}

		if (model.outliner) {
			parseGroups(model.outliner)

			for (const group of Group.all) {
				group.name = toSafeFuntionName(group.name)
			}
		}

		if (model.variants) {
			Variant.fromJSON(model.variants.default, true)
			for (const variantJSON of model.variants.list) {
				Variant.fromJSON(variantJSON)
			}
			Project.variants = Variant.all
		} else {
			new Variant('Default', true)
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

		Canvas.updateAll()
		Validator.validate()
		BLUEPRINT_CODEC.dispatchEvent('parsed', { model })
	},

	// region > compile
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
				last_used_export_namespace: Project.last_used_export_namespace,
			},
			blueprint_settings: Project.animated_java,
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
			const save = texture.getUndoCopy() as Texture
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

		model.animations = [] as any
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

	// region > export
	export() {
		console.log(`Exporting Animated Java Blueprint for ${Project!.name}...`)
		if (!Project) throw new Error('No project to export.')
		Blockbench.export({
			resource_id: 'animated_java_blueprint.export',
			name: (Project.name || 'unnamed') + '.ajblueprint',
			startpath: Project.save_path,
			type: 'json',
			extensions: [BLUEPRINT_CODEC.extension],
			content: BLUEPRINT_CODEC.compile(),
			// eslint-disable-next-line @typescript-eslint/naming-convention
			custom_writer: (content, path) => {
				if (fs.existsSync(PathModule.dirname(path))) {
					Project!.save_path = path
					BLUEPRINT_CODEC.write(content, path)
				} else {
					console.error(
						`Failed to export Animated Java Blueprint, file location '${path}' does not exist!`
					)
					Blockbench.showMessageBox({
						title: translate('error.blueprint_export_path_doesnt_exist.title'),
						message: translate('error.blueprint_export_path_doesnt_exist', path),
					})
				}
			},
		})
	},

	// ANCHOR - Codec:fileName
	fileName() {
		if (!Project || !Project.name) return 'unnamed_project.ajblueprint'
		return `${Project.name}.ajblueprint`
	},
})

// region Format
export const BLUEPRINT_FORMAT = new Blockbench.ModelFormat({
	id: 'animated_java_blueprint',
	name: 'Animated Java Blueprint',
	icon: 'icon-armor_stand',
	category: 'animated_java',
	target: 'Minecraft: Java Edition',
	confidential: false,
	condition: () => true,
	show_on_start_screen: true,
	format_page: {
		component: {
			methods: {},
			created() {
				void injectSvelteCompomponent({
					elementSelector: () => $('#format_page_animated_java_blueprint_mount')[0],
					component: FormatPageSvelte,
					props: {},
				})
			},
			template: `<div id="format_page_animated_java_blueprint_mount" style="display: flex; flex-direction: column; flex-grow: 1;"></div>`,
		},
	},

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	onSetup(project, newModel) {
		if (!Project) return
		console.log('Animated Java Blueprint format setup')
		const defaults = getDefaultProjectSettings()
		Project.animated_java ??= defaults
		for (const [key, value] of Object.entries(defaults) as Array<
			[keyof ModelProject['animated_java'], any]
		>) {
			if (Project.animated_java[key] === undefined) {
				// @ts-ignore
				Project.animated_java[key] = value
			}
		}

		const thisProject = Project
		Project.variants ??= []
		Project.last_used_export_namespace = Project.animated_java.export_namespace
		const updateBoundingBoxIntervalId = setInterval(() => {
			updateBoundingBox()
		}, 500)
		events.UNLOAD.subscribe(() => clearInterval(updateBoundingBoxIntervalId), true)
		events.UNINSTALL.subscribe(() => clearInterval(updateBoundingBoxIntervalId), true)

		Project.loadingPromises ??= []
		Project.loadingPromises.push(
			new Promise<void>(resolve => {
				requestAnimationFrame(() => {
					thisProject.pluginMode = new Valuable(
						thisProject.animated_java.enable_plugin_mode
					)
					// Remove the default title
					const element = document.querySelector('#tab_bar_list .icon-armor_stand.icon')
					element?.remove()
					// Custom title
					void injectSvelteCompomponent({
						elementSelector: () => {
							const titles = [
								...document.querySelectorAll(
									`.project_tab[title="${project.name}"]`
								),
							]
							if (titles.length) {
								return titles[0]
							}
						},
						prepend: true,
						component: ProjectTitleSvelte,
						props: { pluginMode: thisProject.pluginMode },
					})

					if (Variant.all.length === 0) new Variant('Default', true)
					Variant.selectDefault()
				})
				resolve()
			})
		)
	},

	onActivation() {
		console.log('Animated Java Blueprint format activated')
	},

	codec: BLUEPRINT_CODEC,

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
BLUEPRINT_CODEC.format = BLUEPRINT_FORMAT

export function isCurrentFormat() {
	return Format.id === BLUEPRINT_FORMAT.id
}

export function saveBlueprint() {
	if (!Project || !Format) return
	if (Format !== BLUEPRINT_FORMAT) return
	BLUEPRINT_CODEC.write(BLUEPRINT_CODEC.compile(), Project.save_path)
}

export function updateRotationLock() {
	if (!isCurrentFormat()) return
	BLUEPRINT_FORMAT.rotation_limit = !(
		!!Group.first_selected ||
		!!AnimatedJava.API.TextDisplay.selected.length ||
		!!AnimatedJava.API.VanillaItemDisplay.selected.length ||
		!!AnimatedJava.API.VanillaBlockDisplay.selected.length ||
		!!(OutlinerElement.types.camera?.selected && OutlinerElement.types.camera?.selected)
	)
	BLUEPRINT_FORMAT.rotation_snap = BLUEPRINT_FORMAT.rotation_limit
}

export function disableRotationLock() {
	if (!isCurrentFormat()) return
	BLUEPRINT_FORMAT.rotation_limit = false
	BLUEPRINT_FORMAT.rotation_snap = false
}

events.SELECT_PROJECT.subscribe(project => {
	if (project.format.id === BLUEPRINT_FORMAT.id) {
		events.SELECT_AJ_PROJECT.dispatch(project)
	}
})
events.UNSELECT_PROJECT.subscribe(project => {
	if (project.format.id === BLUEPRINT_FORMAT.id) {
		events.UNSELECT_AJ_PROJECT.dispatch(project)
	}
})
events.UPDATE_SELECTION.subscribe(updateRotationLock)
events.SELECT_AJ_PROJECT.subscribe(() => {
	requestAnimationFrame(() => {
		updateBoundingBox()
		updateRotationLock()
	})
})
events.UNSELECT_AJ_PROJECT.subscribe(project => {
	if (project.visualBoundingBox) scene.remove(project.visualBoundingBox)
	disableRotationLock()
})
