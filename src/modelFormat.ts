import * as pathjs from 'path'
import * as fs from 'fs'

const FORMAT_VERSION = 1.0

function processHeader(model: any) {
	if (!model.meta) {
		Blockbench.showMessageBox({
			translateKey: 'invalid_model',
			icon: 'error',
		})
		return
	}
	if (!model.meta.format_version) {
		model.meta.format_version = model.meta.format
	}
	if (compareVersions(model.meta.format_version, FORMAT_VERSION)) {
		Blockbench.showMessageBox({
			translateKey: 'outdated_client',
			icon: 'error',
		})
		return
	}
}
function processCompatibility(model: any) {
	if (!model.meta.model_format) {
		if (model.meta.bone_rig) {
			model.meta.model_format = 'bedrock_old'
		} else {
			model.meta.model_format = 'java_block'
		}
	}

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
		setupProject(Formats[model.meta.model_format] || Formats.free)
		var name = pathToName(file.path, true)
		if (file.path && isApp && !file.no_file) {
			let project = Project
			Project!.save_path = file.path
			Project!.name = pathToName(name, false)
			addRecentProject({
				name,
				path: file.path,
				icon: 'icon-armor_stand',
			})
			setTimeout(() => {
				if (Project == project) updateRecentProjectThumbnail()
			}, 200)
		}
		this.parse!(model, file.path)
	},
	compile(options) {
		if (!Project) return
		if (!options) options = 0
		var model: any = {
			meta: {
				format_version: FORMAT_VERSION,
				//creation_time: Math.round(new Date().getTime()/1000),
				backup: options.backup ? true : undefined,
				model_format: Format.id,
				box_uv: Project?.box_uv,
			},
		}

		for (var key in ModelProject.properties) {
			if (ModelProject.properties[key].export == false) continue
			ModelProject.properties[key].copy(Project, model)
		}

		if (Project?.overrides) {
			model.overrides = Project.overrides
		}
		model.resolution = {
			width: Project?.texture_width || 16,
			height: Project?.texture_height || 16,
		}
		if (options.flag) {
			model.flag = options.flag
		}

		if (options.editor_state) {
			Project?.saveEditorState()
			model.editor_state = {
				save_path: Project?.save_path,
				export_path: Project?.export_path,
				saved: Project?.saved,
				added_models: Project?.added_models,
				mode: Project?.mode,
				tool: Project?.tool,
				display_uv: Project?.display_uv,
				exploded_view: Project?.exploded_view,
				uv_viewport: Project?.uv_viewport,
				previews: JSON.parse(JSON.stringify(Project?.previews)),

				selected_elements: Project?.selected_elements.map(e => e.uuid),
				selected_group: Project?.selected_group?.uuid,
				mesh_selection: JSON.parse(JSON.stringify(Project?.mesh_selection)),
				selected_faces: Project?.selected_faces,
				selected_texture: Project?.selected_texture?.uuid,
			}
		}

		model.textures = []
		Texture.all.forEach(tex => {
			var t = tex.getUndoCopy()
			delete t.selected
			if (isApp && Project?.save_path && tex.path) {
				let relative = pathjs.relative(Project.save_path, tex.path)
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
				if (a.getUndoCopy)
					model.animations.push(
						a.getUndoCopy(
							{ bone_names: true, absolute_paths: options.absolute_paths },
							true
						)
					)
			})
		}
		if (AnimationController.all.length) {
			model.animation_controllers = []
			AnimationController.all.forEach(a => {
				if (a.getUndoCopy) model.animation_controllers.push(a.getUndoCopy())
			})
		}
		if (Interface.Panels.variable_placeholders.inside_vue._data.text) {
			model.animation_variable_placeholders =
				Interface.Panels.variable_placeholders.inside_vue._data.text
		}

		if (Format.display_mode && Object.keys(Project!.display_settings).length >= 1) {
			var new_display: any = {}
			var entries = 0
			for (var i in DisplayMode.slots) {
				let key: string = DisplayMode.slots[i]
				if (
					DisplayMode.slots.hasOwnProperty(i) &&
					Project!.display_settings[key] &&
					Project!.display_settings[key].export
				) {
					new_display[key] = Project!.display_settings[key].export!()
					entries++
				}
			}
			if (entries) {
				model.display = new_display
			}
		}

		if (!options.backup) {
			// Backgrounds
			const backgrounds: any = {}

			for (var key in Project?.backgrounds) {
				let scene = Project?.backgrounds[key]
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
				var e = {
					before: omitKeys(h.before, ['aspects']),
					post: omitKeys(h.post, ['aspects']),
					action: h.action,
					time: h.time,
				}
				model.history.push(e)
			})
			model.history_index = Undo.index
		}

		Blockbench.dispatchEvent('save_project', { model, options })
		if (this.dispatchEvent) this.dispatchEvent('compile', { model, options })

		if (options.raw) {
			return model
		} else if (options.compressed) {
			var json_string = JSON.stringify(model)
			var compressed =
				'<lz>' + LZUTF8.compress(json_string, { outputEncoding: 'StorageBinaryString' })
			return compressed
		} else {
			if (Settings.get('minify_bbmodel') || options.minify) {
				return JSON.stringify(model)
			} else {
				return JSON.stringify(model, null, '\t')
			}
		}
	},
	parse(model, path) {
		if (!Project) return
		// processHeader(model)
		// processCompatibility(model)
		if (model.meta.model_format) {
			if (!Formats[model.meta.model_format]) {
				Blockbench.showMessageBox({
					translateKey: 'invalid_format',
					message: tl('message.invalid_format.message', [model.meta.model_format]),
				})
			}
			var format = Formats[model.meta.model_format] || Formats.free
			format.select()
		}

		Blockbench.dispatchEvent('load_project', { model, path })
		this.dispatchEvent!('parse', { model })

		if (model.meta.box_uv !== undefined && Format.optional_box_uv) {
			Project.box_uv = model.meta.box_uv
		}

		for (var key in ModelProject.properties) {
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
			model.textures.forEach((tex: any) => {
				var tex_copy = new Texture(tex, tex.uuid).add(false)
				if (isApp && tex.relative_path && Project.save_path) {
					let resolved_path = pathjs.resolve(Project.save_path, tex.relative_path)
					if (fs.existsSync(resolved_path)) {
						tex_copy.fromPath(resolved_path)
						return
					}
				}
				if (isApp && tex.path && fs.existsSync(tex.path) && !model.meta.backup) {
					tex_copy.fromPath(tex.path)
					return
				}
				if (tex.source && tex.source.substr(0, 5) == 'data:') {
					tex_copy.fromDataURL(tex.source)
				}
			})
		}

		if (model.elements) {
			let default_texture = Texture.getDefault()
			model.elements.forEach((element: any) => {
				var copy = OutlinerElement.fromSave(element, true)
				if (copy instanceof Cube) {
					for (var face in copy.faces) {
						if (!Format.single_texture && element.faces) {
							var texture =
								element.faces[face].texture !== null &&
								Texture.all[element.faces[face].texture]
							if (texture) {
								copy.faces[face].texture = texture.uuid
							}
						} else if (
							default_texture &&
							copy.faces &&
							copy.faces[face].texture !== null
						) {
							copy.faces[face].texture = default_texture.uuid
						}
					}
				}
				copy.init()
			})
		}
		if (model.outliner) {
			parseGroups(model.outliner)
		}
		if (model.animations) {
			model.animations.forEach((anim: BBAnimation) => {
				var base_ani = new Blockbench.Animation()
				base_ani.uuid = anim.uuid
				base_ani.extend(anim).add()
				if (isApp && Format.animation_files) {
					base_ani.saved_name = base_ani.name
				}
			})
		}
		if (model.animation_controllers) {
			model.animation_controllers.forEach((anim: BBAnimation) => {
				var base_ani = new AnimationController()
				base_ani.uuid = anim.uuid
				base_ani.extend(anim).add()
				if (isApp && Format.animation_files) {
					base_ani.saved_name = base_ani.name
				}
			})
		}
		if (model.animation_variable_placeholders) {
			Interface.Panels.variable_placeholders.inside_vue._data.text =
				model.animation_variable_placeholders
		}
		if (model.display !== undefined) {
			DisplayMode.loadJSON(model.display)
		}
		if (model.backgrounds) {
			for (var key in model.backgrounds) {
				if (Project.backgrounds.hasOwnProperty(key)) {
					let store = model.backgrounds[key]
					let real = Project.backgrounds[key]

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
			Undo.index = model.history_index
		}
		Canvas.updateAllBones()
		Canvas.updateAllPositions()
		Validator.validate()
		this.dispatchEvent!('parsed', { model })

		if (model.editor_state) {
			let state = model.editor_state
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
				for (let id in state.previews) {
					Project.previews[id] = state.previews[id]
				}
			}
			state.selected_elements.forEach((uuid: string) => {
				let el = Outliner.elements.find(el2 => el2.uuid == uuid)
				if (el) Project.selected_elements.push(el)
			})
			Group.selected =
				state.selected_group && Group.all.find(g => g.uuid == state.selected_group)
			for (let key in state.selected_vertices) {
				Project.mesh_selection[key] = state.mesh_selection[key]
			}
			Project.selected_faces.replace(state.selected_faces)
			;(
				state.selected_texture && Texture.all.find(t => t.uuid == state.selected_texture)
			)?.select()

			Project.loadEditorState()
		}
	},
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
// FIXME Should actively convert old models as best it can to the new format
// Backwards compatability with old model format
Formats['animated_java/ajmodel'] = ajModelFormat
