import * as fs from 'fs'
import { AnimatedJavaExporter } from './exporter'
import { getDefaultProjectSettings } from './projectSettings'
import { consoleGroup, consoleGroupCollapsed } from './util/console'
import * as events from './util/events'
import { createBlockbenchMod } from './util/moddingTools'
import { TextureMap, Variant, VariantsContainer } from './variants'

const FORMAT_VERSION = '1.0'

function processVersionMigration(model: any) {
	if (!model.meta.format_version) {
		model.meta.format_version = FORMAT_VERSION
	}

	if (model.meta.model_format === 'animatedJava/ajmodel') {
		model.meta.model_format = 'animated_java/ajmodel'
	}

	const needsUpgrade = model.meta.format_version !== FORMAT_VERSION
	if (!needsUpgrade) return

	console.log('Upgrading model from version', model.meta.format_version, 'to', FORMAT_VERSION)

	if (model.meta.settings) {
		console.log('Upgrading settings...')
		const animatedJava: IAnimatedJavaModel['animated_java'] = {
			settings: {
				project_name: model.meta.settings.animatedJava.projectName,
				verbose: model.meta.settings.animatedJava.verbose,
				rig_item: model.meta.settings.animatedJava.rigItem,
				rig_item_model: model.meta.settings.animatedJava.predicateFilePath,
				rig_export_folder: model.meta.settings.animatedJava.rigModelsExportFolder,
			},
			exporter_settings: {},
			variants: [],
		} as IAnimatedJavaModel['animated_java']

		model.animated_java = animatedJava
	}

	if (model.meta.variants) {
		console.log('Upgrading variants...')
		const variants: IAnimatedJavaModel['animated_java']['variants'] = []

		for (const [name, variant] of Object.entries(model.meta.variants as Record<string, any>)) {
			variants.push({
				name,
				uuid: guid(),
				textureMap: variant,
				default: name === 'default',
				affectedBones: [],
				affectedBonesIsAWhitelist: false,
			})
		}

		model.animated_java.variants = variants
	}

	if (
		model.animations &&
		model.animations.find((a: any) =>
			Object.keys(a.animators as Record<string, any>).find(name => name === 'effects')
		)
	) {
		console.log('Upgrading effects...')

		for (const animation of model.animations) {
			const effects = animation.animators.effects
			if (!effects) continue
			for (const keyframe of effects.keyframes) {
				if (keyframe.channel !== 'timeline') continue
				for (const dataPoint of keyframe.data_points) {
					if (dataPoint.script) {
						dataPoint.commands = dataPoint.script
						delete dataPoint.script
						keyframe.channel = 'commands'
					}
				}
			}
		}

		console.log('Upgrading effects complete', model.animations)
	}

	model.meta.format_version = FORMAT_VERSION

	delete model.meta.variants
	delete model.meta.settings
	delete model.meta.uuid

	console.log('Upgrade complete')
}

function addProjectToRecentProjects(file: FileResult) {
	if (!Project || !file.path) return
	const name = pathToName(file.path, true)
	if (file.path && isApp && !file.no_file) {
		const project = Project
		Project.save_path = file.path
		Project.name = pathToName(name, false)
		addRecentProject({
			name,
			path: file.path,
			icon: ajModelFormat.icon,
		})
		setTimeout(() => {
			if (Project === project) void updateRecentProjectThumbnail()
		}, 200)
	}
}

interface IAnimatedJavaModel {
	animated_java: {
		settings?: Record<string, any>
		exporter_settings?: Record<string, Record<string, any>>
		variants?: Array<{
			name?: string
			textureMap?: TextureMap
			default?: boolean
			uuid?: string
			affectedBones?: string[]
			affectedBonesIsAWhitelist?: boolean
		}>
	}

	flag?: any
	meta?: any
	parent?: any
	history?: any
	display?: any
	textures?: any
	elements?: any
	overrides?: any
	animations?: Record<string, any>
	outliner?: any[]
	resolution?: any
	history_index?: number
	animation_controllers?: any
	backgrounds?: Record<string, any>
	editor_state?: Record<string, any>
	animation_variable_placeholders?: any
}

const loadAnimatedJavaProjectSettings = consoleGroup(
	'loadAnimatedJavaProjectSettings',
	(model: IAnimatedJavaModel) => {
		if (!Project) return

		const settings = getDefaultProjectSettings()
		for (const setting of Object.values(settings)) {
			setting._onInit()
		}
		if (!(model.animated_java && model.animated_java.settings)) return

		console.log('Loading Animated Java project settings...')

		for (const [name, setting] of Object.entries(settings)) {
			if (model.animated_java.settings[name])
				setting._load(model.animated_java.settings[name])
		}
		Project.animated_java_settings = settings
	}
)

const loadAnimatedJavaExporterSettings = consoleGroup(
	'loadAnimatedJavaExporterSettings',
	(model: IAnimatedJavaModel) => {
		if (!Project) return
		const settings: typeof Project.animated_java_exporter_settings = {}
		if (!model.animated_java.exporter_settings) return

		for (const exporter of AnimatedJavaExporter.all) {
			if (!exporter) continue
			console.log('Loading settings for', exporter.id)
			settings[exporter.id] = exporter.getSettings()

			const savedSettings = model.animated_java.exporter_settings[exporter.id]
			if (!savedSettings) continue

			console.log(`Loading ${exporter.id} settings...`)
			for (const [settingId, settingValue] of Object.entries(savedSettings)) {
				if (!model.animated_java.exporter_settings[exporter.id][settingId]) continue
				if (!settings[exporter.id][settingId]) {
					console.warn('Setting', settingId, 'does not exist in exporter', exporter.id)
					continue
				}
				console.log('Loading value for', exporter.id, settingId, settingValue)
				settings[exporter.id][settingId]._load(settingValue)
			}
		}
		Project.animated_java_exporter_settings = settings
	}
)

const exportAnimatedJavaProjectSettings = consoleGroup('exportAnimatedJavaProjectSettings', () => {
	if (!Project?.animated_java_settings) return
	const exported: Record<string, any> = {}
	for (const [name, setting] of Object.entries(Project.animated_java_settings)) {
		exported[name] = setting._save()
	}

	return exported
})

function exportAnimatedJavaExporterSettings() {
	if (!Project?.animated_java_exporter_settings) return
	const exported: Record<string, any> = {}
	for (const [exporterId, exporterSettings] of Object.entries(
		Project.animated_java_exporter_settings
	)) {
		exported[exporterId] = {}
		for (const [settingId, setting] of Object.entries(exporterSettings)) {
			exported[exporterId][settingId] = setting._save()
		}
	}

	return exported
}

const loadAnimatedJavaVariants = consoleGroup(
	'loadAnimatedJavaVariants',
	(model: IAnimatedJavaModel) => {
		if (!Project) return

		Project.animated_java_variants = new VariantsContainer()
		if (!(model.animated_java && model.animated_java.variants)) return

		console.log('Loading Animated Java variants...')
		for (const {
			name,
			textureMap,
			uuid,
			default: isDefault,
			affectedBones,
			affectedBonesIsAWhitelist,
		} of model.animated_java.variants) {
			console.log('Loading variant', name)
			if (!(name && textureMap && uuid)) continue
			Project.animated_java_variants.addVariant(
				Variant.fromJSON({
					name,
					textureMap: textureMap,
					uuid,
					affectedBones,
					affectedBonesIsAWhitelist,
				}),
				isDefault
			)
		}

		Project.animated_java_variants.select()
	}
)

const exportAnimatedJavaVariants = consoleGroup('exportAnimatedJavaVariants', () => {
	if (!Project?.animated_java_variants) return
	const exported: IAnimatedJavaModel['animated_java']['variants'] = []
	for (const variant of Project.animated_java_variants.variants) {
		exported.push(variant.toJSON())
	}

	return exported
})

events.UPDATE_SELECTION.subscribe(() => {
	if (Format === ajModelFormat && Mode.selected.id === 'edit') {
		if (!Group.selected && Cube.selected.length > 0) {
			Format.rotation_limit = true
			Format.rotation_snap = true
		} else {
			Format.rotation_limit = false
			Format.rotation_snap = false
		}
	}
})

export const ajCodec = new Blockbench.Codec('ajmodel', {
	name: 'Animated Java Model',
	remember: true,
	extension: 'ajmodel',
	load_filter: {
		extensions: ['ajmodel', 'mcmodel'],
		type: 'json',
	},

	load: consoleGroupCollapsed('ajCodec:load', (model, file) => {
		setupProject(ajModelFormat)
		if (!Project || !ajCodec.parse) return
		Project.save_path = file.path
		Project.export_path = file.path
		addProjectToRecentProjects(file)
		ajCodec.parse(model, file.path)
		events.LOAD_PROJECT.dispatch()
	}),

	parse: consoleGroupCollapsed('ajCodec:parse', (model: IAnimatedJavaModel, path) => {
		if (!Project) throw new Error('No project to load model into...')
		console.log('Parsing Animated Java model...')
		if (!model.elements && !model.parent && !model.display && !model.textures) {
			Blockbench.showMessageBox({
				translateKey: 'invalid_model',
				icon: 'error',
			})
			return
		}
		ajCodec.dispatchEvent('parse', { model, path })
		processVersionMigration(model)
		loadAnimatedJavaProjectSettings(model)
		loadAnimatedJavaExporterSettings(model)

		if (model.meta.box_uv !== undefined && Format.optional_box_uv) {
			Project.box_uv = model.meta.box_uv
		}

		for (const key in ModelProject.properties) {
			ModelProject.properties[key].merge(Project, model)
		}

		if (model.overrides) {
			Project.overrides = model.overrides
		}
		if (model.resolution !== undefined) {
			Project.texture_width = model.resolution.width
			Project.texture_height = model.resolution.height
		}

		if (model.textures) {
			model.textures.forEach((tex: Texture) => {
				const texCopy = new Texture(tex, tex.uuid).add(false)
				if (isApp && tex.relative_path && Project.save_path) {
					const resolvedPath = PathModule.resolve(Project.save_path, tex.relative_path)
					if (fs.existsSync(resolvedPath)) {
						texCopy.fromPath(resolvedPath)
						return
					}
				}
				if (isApp && tex.path && fs.existsSync(tex.path) && !model.meta.backup) {
					texCopy.fromPath(tex.path)
					return
				}
				if (tex.source && tex.source.substr(0, 5) == 'data:') {
					texCopy.fromDataURL(tex.source)
				}
			})
		}
		loadAnimatedJavaVariants(model)

		if (model.elements) {
			const defaultTexture = Texture.getDefault()
			model.elements.forEach(function (element: any) {
				const copy = OutlinerElement.fromSave(element, true) as Cube
				for (const face in copy.faces) {
					if (!Format.single_texture && element.faces) {
						const texture =
							element.faces[face].texture !== null &&
							Texture.all[element.faces[face].texture]
						if (texture) {
							copy.faces[face].texture = texture.uuid
						}
					} else if (defaultTexture && copy.faces && copy.faces[face].texture !== null) {
						copy.faces[face].texture = defaultTexture.uuid
					}
				}
				copy.init()
			})
		}
		if (model.outliner) {
			parseGroups(model.outliner)
		}
		if (model.animations) {
			model.animations.forEach((anim: _Animation) => {
				const baseAnim = new Blockbench.Animation()
				baseAnim.uuid = anim.uuid
				baseAnim.extend(anim).add()
				if (isApp && Format.animation_files) {
					baseAnim.saved_name = baseAnim.name
				}
			})
		}
		// if (model.animation_controllers) {
		// 	model.animation_controllers.forEach((anim: _Animation) => {
		// 		var base_ani = new AnimationController()
		// 		base_ani.uuid = anim.uuid
		// 		base_ani.extend(anim).add()
		// 		if (isApp && Format.animation_files) {
		// 			base_ani.saved_name = base_ani.name
		// 		}
		// 	})
		// }
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
		ajCodec.dispatchEvent('parsed', { model })

		if (model.editor_state) {
			const state = model.editor_state
			Merge.string(Project, state, 'save_path')
			Merge.string(Project, state, 'export_path')
			Merge.boolean(Project, state, 'saved')
			Merge.number(Project, state, 'added_models')
			Merge.string(Project, state, 'mode')
			Merge.string(Project, state, 'tool')
			Merge.string(Project, state, 'display_uv')
			Merge.boolean(Project, state, 'exploded_view')
			if (state.uv_viewport) {
				Merge.number(Project.uv_viewport, state.uv_viewport, 'zoom')
				Merge.arrayVector2((Project.uv_viewport = state.uv_viewport), 'offset')
			}
			if (state.previews) {
				for (const id in state.previews) {
					Project.previews[id] = state.previews[id]
				}
			}
			state.selected_elements.forEach((uuid: string) => {
				const el = Outliner.elements.find(el2 => el2.uuid == uuid)
				if (el) Project.selected_elements.push(el)
			})
			Group.selected =
				state.selected_group && Group.all.find(g => g.uuid == state.selected_group)
			for (const key in state.selected_vertices) {
				Project.mesh_selection[key] = state.mesh_selection[key]
			}
			Project.selected_faces.replace(state.selected_faces as any[])
			;(
				state.selected_texture && Texture.all.find(t => t.uuid == state.selected_texture)
			)?.select()

			Project.loadEditorState()
		}

		// ajCodec.dispatchEvent('parsed', { model })
	}),

	compile: consoleGroupCollapsed('ajCodec:compile', options => {
		if (!options) options = {}
		if (!Project) throw new Error('No project to compile...')
		console.log('Compiling Animated Java model...')

		const selectedVariant = Project.animated_java_variants!.selectedVariant
		Project.animated_java_variants!.select()

		const model: IAnimatedJavaModel = {
			meta: {
				format: ajCodec.format.id,
				format_version: FORMAT_VERSION,
			},
			animated_java: {
				settings: exportAnimatedJavaProjectSettings(),
				exporter_settings: exportAnimatedJavaExporterSettings(),
				variants: exportAnimatedJavaVariants(),
			},
		}

		for (const key in ModelProject.properties) {
			if (ModelProject.properties[key].export)
				ModelProject.properties[key].copy(Project, model)
		}

		if (Project.overrides) {
			model.overrides = Project.overrides
		}
		model.resolution = {
			width: Project.texture_width || 16,
			height: Project.texture_height || 16,
		}

		if (options.flag) {
			model.flag = options.flag
		}

		if (options.editor_state) {
			Project.saveEditorState()
			model.editor_state = {
				save_path: Project.save_path,
				export_path: Project.export_path,
				saved: Project.saved,
				added_models: Project.added_models,
				mode: Project.mode,
				tool: Project.tool,
				display_uv: Project.display_uv,
				exploded_view: Project.exploded_view,
				uv_viewport: Project.uv_viewport,
				previews: JSON.parse(JSON.stringify(Project.previews)),

				selected_elements: Project.selected_elements.map(e => e.uuid),
				selected_group: Project.selected_group?.uuid,
				mesh_selection: JSON.parse(JSON.stringify(Project.mesh_selection)),
				selected_faces: Project.selected_faces,
				selected_texture: Project.selected_texture?.uuid,
			}
		}

		model.elements = []
		elements.forEach(el => {
			const obj = el.getSaveCopy && el.getSaveCopy(!!model.meta)
			model.elements.push(obj)
		})
		model.outliner = compileGroups(true)

		model.textures = []
		Texture.all.forEach(tex => {
			const t = tex.getUndoCopy()
			delete t.selected
			if (isApp && Project.save_path && tex.path) {
				const relative = PathModule.relative(Project.save_path, tex.path)
				t.relative_path = relative.replace(/\\/g, '/')
			}
			if (
				options.bitmaps != false &&
				(Settings.get('embed_textures') || options.backup || options.bitmaps == true)
			) {
				t.source = 'data:image/png;base64,' + tex.getBase64()
				t.mode = 'bitmap'
			}
			if (options.absolute_paths == false) delete t.path
			model.textures.push(t)
		})

		if (Blockbench.Animation.all.length) {
			model.animations = []
			Blockbench.Animation.all.forEach(a => {
				model.animations!.push(
					a.getUndoCopy &&
						a.getUndoCopy(
							{ bone_names: true, absolute_paths: options.absolute_paths },
							true
						)
				)
			})
		}
		// if (AnimationController.all.length) {
		// 	model.animation_controllers = []
		// 	AnimationController.all.forEach(a => {
		// 		model.animation_controllers.push(a.getUndoCopy && a.getUndoCopy())
		// 	})
		// }
		if (Interface.Panels.variable_placeholders.inside_vue._data.text) {
			model.animation_variable_placeholders =
				Interface.Panels.variable_placeholders.inside_vue._data.text
		}

		if (!options.backup) {
			// Backgrounds
			const backgrounds: IAnimatedJavaModel['backgrounds'] = {}

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

		const content = compileJSON(model)
		ajCodec.dispatchEvent('compile', { model, options })

		if (selectedVariant) Project.animated_java_variants!.select(selectedVariant)

		return content
	}),

	export: consoleGroupCollapsed('ajCodec:export', () => {
		console.log('Exporting Animated Java model...')
		Blockbench.export({
			resource_id: 'animated_java.export',
			type: 'json',
			extensions: [ajCodec.extension],
			content: ajCodec.compile(),
			// eslint-disable-next-line @typescript-eslint/naming-convention
			custom_writer: (content, path) => {
				ajCodec.write(content, path)
			},
		})
	}),

	fileName() {
		return Project?.animated_java_settings?.project_namespace.value || 'unnamed_project'
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
	// onStart() {},
	codec: ajCodec,

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

createBlockbenchMod(
	'animated_java:save_project',
	{
		action: BarItems.save_project as Action,
		originalClick: (BarItems.save_project as Action).click,
	},
	context => {
		context.action.click = (event: Event) => {
			if (Project && Format === ajModelFormat) {
				ajCodec.write(ajCodec.compile(), Project.save_path)
			} else {
				context.originalClick.call(context.action, event)
			}
		}
		return context
	},
	context => {
		context.action.click = context.originalClick
	}
)

createBlockbenchMod(
	'animated_java:save_project_as',
	{
		action: BarItems.save_project_as as Action,
		originalClick: (BarItems.save_project_as as Action).click,
	},
	context => {
		context.action.click = (event: Event) => {
			if (Project && Format === ajModelFormat) {
				ajCodec.export()
			} else {
				context.originalClick.call(context.action, event)
			}
		}
		return context
	},
	context => {
		context.action.click = context.originalClick
	}
)

createBlockbenchMod(
	'animated_java:export_over',
	{
		action: BarItems.export_over as Action,
		originalClick: (BarItems.export_over as Action).click,
	},
	context => {
		context.action.click = (event: Event) => {
			if (Project && Format === ajModelFormat) {
				if (Format) {
					saveTextures()
					if (Project.export_path) {
						ajCodec.write(ajCodec.compile(), Project.export_path)
					} else if (!Project.save_path) {
						ajCodec.export()
					}
				}
				if (
					Blockbench.Animation.all.length &&
					BarItems.save_all_animations instanceof Action
				) {
					BarItems.save_all_animations.trigger()
				}
			} else {
				context.originalClick.call(context.action, event)
			}
		}
		return context
	},
	context => {
		context.action.click = context.originalClick
	}
)

createBlockbenchMod(
	'animated_java:events.preSelectProject',
	{
		original: ModelProject.prototype.select,
	},
	context => {
		ModelProject.prototype.select = function (this: ModelProject) {
			if (Project !== this) events.PRE_SELECT_PROJECT.dispatch(this)
			return context.original.call(this)
		}
		return context
	},
	context => {
		ModelProject.prototype.select = context.original
	}
)
