import type { BlueprintSettings } from './blueprintSettings'
import * as blueprintSettings from './blueprintSettings'
import FormatPageSvelte from './components/formatPage.svelte'
import ProjectTitleSvelte from './components/projectTitle.svelte'
import { PACKAGE } from './constants'
import { type BillboardMode, BoneConfig, LocatorConfig } from './nodeConfigs'
import * as ModelDatFixerUpper from './systems/modelDataFixerUpper'
import EVENTS from './util/events'
import { injectSvelteComponent } from './util/injectSvelteComponent'
import { sanitizeStorageKey } from './util/minecraftUtil'
import { registerCodec, registerModelFormat } from './util/moddingTools'
import { Valuable } from './util/stores'
import { translate } from './util/translation'
import { Variant } from './variants'

let boundingBoxUpdateIntervalId: ReturnType<typeof setInterval> | undefined

export const BLUEPRINT_FORMAT_ID = 'animated-java:format/blueprint'

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
	sync_passenger_rotation?: LocatorConfig['syncPassengerRotation']
	on_summon_function?: LocatorConfig['_onSummonFunction']
	on_tick_function?: LocatorConfig['_onTickFunction']
}

/**
 * The serialized Variant Text Display Config
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
	meta?: {
		format?: string
		format_version?: string
		uuid?: string
		last_used_export_namespace?: string
		box_uv?: boolean
		backup?: boolean
		save_location?: string
	}
	/**
	 * The project settings of the Blueprint
	 */
	blueprint_settings?: Partial<BlueprintSettings>
	/**
	 * The variants of the Blueprint
	 */
	variants?: {
		/**
		 * The default Variant of the Blueprint
		 */
		default?: IBlueprintVariantJSON
		/**
		 * The list of variants of the Blueprint, excluding the default Variant
		 */
		list?: IBlueprintVariantJSON[]
	}

	resolution?: {
		width?: number
		height?: number
	}

	elements?: any[]
	outliner?: any[]
	textures?: Texture[]
	animations?: AnimationOptions[]
	animation_controllers?: AnimationControllerOptions[]
	animation_variable_placeholders?: string
	backgrounds?: Record<string, any>
}

//region > Convert
export function convertToBlueprint() {
	// Convert the current project to a Blueprint
	Project!.save_path = ''
	Project!.last_used_export_namespace = ''

	for (const group of Group.all) {
		group.createUniqueName(Group.all.filter(g => g !== group))
		group.sanitizeName()
	}
	for (const animation of Blockbench.Animation.all) {
		animation.createUniqueName(Blockbench.Animation.all.filter(a => a !== animation))
		animation.name = sanitizeStorageKey(animation.name)
	}
	for (const cube of Cube.all) {
		cube.setUVMode(false)
	}
}

export function getDefaultProjectSettings() {
	return { ...blueprintSettings.defaultValues }
}

function initializeRenderBoxPreview() {
	if (boundingBoxUpdateIntervalId == undefined) {
		boundingBoxUpdateIntervalId = setInterval(() => {
			updateRenderBoxPreview()
		}, 500)
		EVENTS.PLUGIN_UNLOAD.subscribe(() => clearInterval(boundingBoxUpdateIntervalId), true)
		EVENTS.PLUGIN_UNINSTALL.subscribe(() => clearInterval(boundingBoxUpdateIntervalId), true)
	}
}

export function updateRenderBoxPreview() {
	if (!Project || !activeProjectIsBlueprintFormat()) return
	if (Project.visualBoundingBox) scene.remove(Project.visualBoundingBox)

	if (!Project.animated_java.show_render_box) return

	let width = 0
	let height = 0
	if (Project.animated_java.auto_render_box) {
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
		width = Project.animated_java.render_box[0]
		height = Project.animated_java.render_box[1]
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
export const BLUEPRINT_CODEC = registerCodec(
	{ id: 'animated-java:codec/blueprint' },
	{
		name: 'Blueprint',
		extension: 'ajblueprint',
		remember: true,
		load_filter: {
			extensions: ['ajblueprint'],
			type: 'json',
		},

		// region > load
		load(model, file, add) {
			console.log(`Loading Animated Java Blueprint from '${file.name}'...`)

			model = ModelDatFixerUpper.process(model)

			const format = BLUEPRINT_FORMAT.get()
			if (format == undefined) {
				throw new Error('Animated Java Blueprint format is not registered!')
			}
			setupProject(format, model.meta?.uuid)
			if (!Project) {
				throw new Error('Failed to load Animated Java Blueprint')
			}

			this.parse!(model, file.path)

			const name = pathToName(file.path, true)
			if (file.path && isApp && !file.no_file) {
				Project.name = pathToName(file.path, false)
				Project.save_path = file.path
				addRecentProject({
					name,
					path: file.path,
					icon: BLUEPRINT_FORMAT.get()?.icon,
				})
				const project = Project
				setTimeout(() => {
					if (Project === project) void updateRecentProjectThumbnail()
				}, 500)
			}
			Settings.updateSettingsInProfiles()

			console.log(
				`Successfully loaded Animated Java Blueprint` +
					`\n - Project: ${Project.name}` +
					`\n - UUID: ${Project.uuid}`
			)
		},

		// region > parse
		// Takes the model file and injects it's data into the global Project
		parse(model: IBlueprintFormatJSON, path) {
			console.log(`Parsing Animated Java Blueprint from '${path}'...`)
			if (!Project) throw new Error('No project to parse into')

			Project.loadingPromises = []

			Project.save_path = path

			if (model.meta?.box_uv !== undefined) {
				Project.box_uv = model.meta.box_uv
			}

			if (model.resolution !== undefined) {
				Project.texture_width = model.resolution.width ?? 16
				Project.texture_height = model.resolution.height ?? 16
			}

			// Misc Project Properties
			for (const key in ModelProject.properties) {
				ModelProject.properties[key].merge(Project, model)
			}

			if (model.blueprint_settings) {
				Project.animated_java = {
					...blueprintSettings.defaultValues,
					...model.blueprint_settings,
				}
			}

			// FIXME - Temporarily disable plugin mode for 1.8.0
			if (Project.animated_java.enable_plugin_mode) {
				Project.animated_java.enable_plugin_mode = false
			}

			Project.last_used_export_namespace =
				model.meta?.last_used_export_namespace ?? Project.animated_java.export_namespace

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
					if (texture.path && fs.existsSync(texture.path) && !model.meta?.backup) {
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
					group.name = sanitizeStorageKey(group.name)
				}
			}

			if (model.variants?.default) {
				Variant.fromJSON(model.variants?.default, true)
			} else {
				console.warn('No default Variant found, creating one named "Default"')
				new Variant('Default', true)
			}

			if (model.variants?.list) {
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
				Interface.Panels.variable_placeholders.inside_vue.$data.text =
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

			this.dispatchEvent!('parsed', { model })
		},

		// region > compile
		compile(options = {}) {
			console.log(`Compiling Animated Java Blueprint from ${Project!.name}...`)
			if (!Project) throw new Error('No project to compile.')

			// Disable variants while compiling
			const previouslySelectedVariant = Variant.selected
			Variant.selectDefault()

			const model: IBlueprintFormatJSON = {
				meta: {
					format: BLUEPRINT_FORMAT_ID,
					format_version: PACKAGE.version,
					uuid: Project.uuid,

					save_location: Project.save_path,
					last_used_export_namespace: Project.last_used_export_namespace,
				},
				resolution: {
					width: Project.texture_width ?? 16,
					height: Project.texture_height ?? 16,
				},
			}

			const defaultSettings = getDefaultProjectSettings()

			for (const key of Object.keys(Project.animated_java) as Array<
				keyof typeof Project.animated_java
			>) {
				const value = Project.animated_java[key]
				if (value == undefined || value === defaultSettings[key]) continue
				model.blueprint_settings ??= {}
				// @ts-expect-error
				model.blueprint_settings[key] = value
			}

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
				const save = texture.getSaveCopy() as Texture
				delete save.selected
				if (
					isApp &&
					Project.save_path &&
					texture.path &&
					PathModule.isAbsolute(texture.path)
				) {
					const relative = PathModule.relative(
						PathModule.dirname(Project.save_path),
						texture.path
					)
					save.relative_path = relative.replace(/\\/g, '/')
				}
				if (
					options.bitmaps != false &&
					(Settings.get('embed_textures') || options.backup || options.bitmaps == true)
				) {
					save.source = texture.getDataURL()
					save.internal = true
				}
				if (options.absolute_paths == false) delete save.path
				model.textures.push(save)
			}

			model.variants = {
				default: Variant.all.find(v => v.isDefault)!.toJSON(),
				list: Variant.all.filter(v => !v.isDefault).map(v => v.toJSON()),
			}

			const animationOptions = { bone_names: true, absolute_paths: options.absolute_paths }
			if (Blockbench.Animation.all.length > 0) {
				model.animations = []
				for (const animation of Blockbench.Animation.all) {
					if (!animation.getUndoCopy) continue
					model.animations.push(animation.getUndoCopy(animationOptions, true))
				}
			}

			if (Blockbench.AnimationController.all.length > 0) {
				model.animation_controllers = []
				for (const controller of Blockbench.AnimationController.all) {
					if (!controller.getUndoCopy) continue
					model.animation_controllers.push(controller.getUndoCopy(animationOptions, true))
				}
			}

			if (Interface.Panels.variable_placeholders.inside_vue.$data.text) {
				model.animation_variable_placeholders =
					Interface.Panels.variable_placeholders.inside_vue.$data.text
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

			console.log('Successfully compiled Animated Java Blueprint', model)
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
				extensions: [this.extension],
				content: this.compile!(),
				// eslint-disable-next-line @typescript-eslint/naming-convention
				custom_writer: (content, path) => {
					if (fs.existsSync(PathModule.dirname(path))) {
						Project!.save_path = path
						this.write!(content, path)
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
			if (!Project?.name) return 'unnamed_project.ajblueprint'
			return `${Project.name}.ajblueprint`
		},
	}
)

// region Format
export const BLUEPRINT_FORMAT = registerModelFormat(
	{ id: BLUEPRINT_FORMAT_ID, dependencies: ['animated-java:codec/blueprint'] },
	{
		name: translate('format.blueprint.name'),
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
					void injectSvelteComponent({
						elementSelector: () =>
							$(`div[id="${BLUEPRINT_FORMAT_ID}/format_page_mount"]`)[0],
						component: FormatPageSvelte,
						props: {},
					}).then(instance => {
						EVENTS.PLUGIN_UNLOAD.subscribe(() => instance.$destroy(), true)
					})
				},
				template: `<div id="${BLUEPRINT_FORMAT_ID}/format_page_mount" style="display: flex; flex-direction: column; flex-grow: 1;"></div>`,
			},
		},

		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		onSetup(project, newModel) {
			if (!Project) return
			console.log('Animated Java Blueprint format setup')

			const defaults = getDefaultProjectSettings()
			if (newModel) {
				Project.animated_java = defaults
				Project.last_used_export_namespace = ''
			} else {
				Project.animated_java = { ...defaults, ...Project!.animated_java }
			}

			const thisProject = Project
			Project.variants ??= []

			initializeRenderBoxPreview()

			Project.loadingPromises ??= []
			Project.loadingPromises.push(
				new Promise<void>(resolve => {
					requestAnimationFrame(() => {
						thisProject.pluginMode = new Valuable(
							thisProject.animated_java.enable_plugin_mode
						)
						// Remove the default title
						const element = document.querySelector(
							'#tab_bar_list .icon-armor_stand.icon'
						)
						element?.remove()
						// Custom title
						void injectSvelteComponent({
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
	}
)

BLUEPRINT_FORMAT.onCreated(format => {
	const codec = BLUEPRINT_CODEC.get()
	if (!codec) throw new Error('Animated Java Blueprint codec is not registered!')

	codec.format = format
	format.codec = codec
})

export function activeProjectIsBlueprintFormat() {
	return Format instanceof ModelFormat && Format.id === BLUEPRINT_FORMAT_ID
}

export function createNewBlueprintProject() {
	const format = BLUEPRINT_FORMAT.get()
	if (!format) throw new Error('Animated Java Blueprint format is not registered!')

	newProject(format)

	requestAnimationFrame(() => {
		Project!.openSettings()
	})
}

export function saveBlueprint() {
	if (!Project || !Format || !activeProjectIsBlueprintFormat()) return

	const codec = BLUEPRINT_CODEC.get()
	if (!codec) throw new Error('Animated Java Blueprint codec is not registered!')

	codec.write(codec.compile(), Project.save_path)
}

export function projectTargetVersionIsAtLeast(version: string): boolean {
	return !compareVersions(version, Project!.animated_java.target_minecraft_version)
}

export function shouldEnableRotationLock(): boolean {
	if (!activeProjectIsBlueprintFormat()) return false

	if (projectTargetVersionIsAtLeast('1.21.4')) {
		return false
	}

	return !(
		!!Group.first_selected ||
		!!AnimatedJava.API.TextDisplay.selected.length ||
		!!AnimatedJava.API.VanillaItemDisplay.selected.length ||
		!!AnimatedJava.API.VanillaBlockDisplay.selected.length ||
		!!(
			Array.isArray(OutlinerElement.types.locator?.selected) &&
			OutlinerElement.types.locator.selected.length
		) ||
		!!(
			Array.isArray(OutlinerElement.types.camera?.selected) &&
			OutlinerElement.types.camera.selected.length
		)
	)
}

export function updateRotationLock() {
	if (!activeProjectIsBlueprintFormat()) return
	const format = BLUEPRINT_FORMAT.get()!
	// If any of these node types are selected, we disable rotation lock.
	format.rotation_limit = shouldEnableRotationLock()
	format.rotation_snap = format.rotation_limit
}

export function disableRotationLock() {
	if (!activeProjectIsBlueprintFormat()) return
	const format = BLUEPRINT_FORMAT.get()!

	format.rotation_limit = false
	format.rotation_snap = false
}

EVENTS.SELECT_PROJECT.subscribe(project => {
	if (project.format.id === BLUEPRINT_FORMAT_ID) {
		EVENTS.SELECT_AJ_PROJECT.publish(project)
	}
})
EVENTS.UNSELECT_PROJECT.subscribe(project => {
	if (project.format.id === BLUEPRINT_FORMAT_ID) {
		EVENTS.UNSELECT_AJ_PROJECT.publish(project)
	}
})
EVENTS.UPDATE_SELECTION.subscribe(updateRotationLock)
EVENTS.SELECT_AJ_PROJECT.subscribe(() => {
	requestAnimationFrame(() => {
		updateRenderBoxPreview()
		updateRotationLock()
	})
})
EVENTS.UNSELECT_AJ_PROJECT.subscribe(project => {
	if (project.visualBoundingBox) scene.remove(project.visualBoundingBox)
	disableRotationLock()
})
