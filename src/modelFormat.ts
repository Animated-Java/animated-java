
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
	load(model: any, file: any) {
		// performUpdateCheck()
		newProject(model.meta.type || 'free')
		var name = pathToName(file.path, true)
		if (file.path && isApp && !file.no_file) {
			Project!.save_path = file.path
			Project!.name = pathToName(name, false)
			addRecentProject({
				name,
				path: file.path,
				icon: 'fa-cube',
			})
		}
		this.parse!(model, file.path)
		MenuBar.update()
		bus.dispatch(events.LIFECYCLE.LOAD_MODEL)
	},
	compile(options) {
		if (!options) options = 0
		var model = {
			meta: {
				format_version: FORMATV,
				creation_time: Math.round(new Date().getTime() / 1000),
				backup: options.backup ? true : undefined,
				model_format: Format.id,
				box_uv: Project.box_uv,
				settings: settings.toObject('project'),
				variants: store.get('variants'),
				uuid: Project.UUID,
			},
		}

		for (var key in ModelProject.properties) {
			ModelProject.properties[key].copy(Project, model)
		}

		if (Project.overrides) {
			model.overrides = Project.overrides
		}
		model.resolution = {
			width: Project.texture_width || 16,
			height: Project.texture_height || 16,
		}
		if (Interface.Panels.variable_placeholders.inside_vue._data.text) {
			model.animation_variable_placeholders =
				Interface.Panels.variable_placeholders.inside_vue._data.text
		}
		if (options.flag) {
			model.flag = options.flag
		}
		model.elements = []
		elements.forEach(el => {
			var obj = el.getSaveCopy(model.meta)
			model.elements.push(obj)
		})
		model.outliner = compileGroups(true)

		model.textures = []
		Texture.all.forEach(tex => {
			var t = tex.getUndoCopy()
			delete t.selected
			if (options.bitmaps != false) {
				t.source = 'data:image/png;base64,' + tex.getBase64()
				t.mode = 'bitmap'
			}
			model.textures.push(t)
		})

		if (Animator.animations.length) {
			model.animations = []
			Animator.animations.forEach(a => {
				model.animations.push(a.getUndoCopy({ bone_names: true }, true))
			})
		}

		if (Format.display_mode && Object.keys(display).length >= 1) {
			var new_display = {}
			var entries = 0
			for (var i in DisplayMode.slots) {
				var key = DisplayMode.slots[i]
				if (DisplayMode.slots.hasOwnProperty(i) && display[key] && display[key].export) {
					new_display[key] = display[key].export()
					entries++
				}
			}
			if (entries) {
				model.display = new_display
			}
		}

		if (options.history) {
			model.history = []
			Undo.history.forEach(h => {
				var e = {
					before: omitKeys(h.before, ['aspects']),
					post: omitKeys(h.post, ['aspects']),
					action: h.action,
				}
				model.history.push(e)
			})
			model.history_index = Undo.index
		}

		Blockbench.dispatchEvent('save_project', { model })
		this.dispatchEvent('compile', { model, options })

		if (options.raw) {
			return model
		} else if (options.compressed) {
			var json_string = JSON.stringify(model, null, 2)
			var compressed =
				'<lz>' +
				LZUTF8.compress(json_string, {
					outputEncoding: 'StorageBinaryString',
				})
			return compressed
		} else {
			return JSON.stringify(model, null, 2)
		}
	},
	parse(model: any, path: any) {
		console.groupCollapsed('Parse .ajmodel')

		if (!model.meta) {
			Blockbench.showMessageBox({
				tlKey: 'invalid_model',
				icon: 'error',
			})
			return
		}
		if (!model.meta.format_version) {
			model.meta.format_version = model.meta.format
		}
		if (model.animation_variable_placeholders) {
			Interface.Panels.variable_placeholders.inside_vue._data.text =
				model.animation_variable_placeholders
		}
		if (model.meta.settings) {
			settings.update(model.meta.settings)
			console.log('Got settings from model file')
		} else {
			settings.update(DefaultSettings, true)
		}
		if (model.meta.uuid) {
			Project.UUID = model.meta.uuid
		} else {
			Project.UUID = guid()
		}
		if (model.meta.variants) {
			store.set('variants', model.meta.variants)
			console.log('Got variants from model file')
		} else {
			store.set('variants', { default: {} })
		}
		if (model.meta.model_format) {
			var format = Formats[model.meta.model_format] || Formats.free
			format.select()
		} else if (model.meta.bone_rig) {
			Formats.bedrock_old.select()
		} else {
			Formats.java_block.select()
		}

		Blockbench.dispatchEvent('load_project', { model, path })
		this.dispatchEvent('parse', { model })

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
			model.textures.forEach(tex => {
				var tex_copy = new Texture(tex, tex.uuid).add(false)
				if (isApp && tex.path && fs.existsSync(tex.path) && !model.meta.backup) {
					tex_copy.fromPath(tex.path)
				} else if (tex.source && tex.source.substr(0, 5) == 'data:') {
					tex_copy.fromDataURL(tex.source)
				}
				tex_copy.name = tex.name
			})
		}
		if (model.cubes && !model.elements) {
			model.elements = model.cubes
		}
		if (model.elements) {
			model.elements.forEach(function (element) {
				var copy = OutlinerElement.fromSave(element, true)
				for (var face in copy.faces) {
					if (!Format.single_texture && element.faces) {
						var texture =
							element.faces[face].texture !== null &&
							Texture.all[element.faces[face].texture]
						if (texture) {
							copy.faces[face].texture = texture.uuid
						}
					} else if (
						Texture.getDefault() &&
						copy.faces &&
						copy.faces[face].texture !== null
					) {
						copy.faces[face].texture = Texture.getDefault().uuid
					}
				}
				copy.init()
			})
			//   loadOutlinerDraggable();
		}
		if (model.outliner) {
			parseGroups(model.outliner)
			if (model.meta.bone_rig) {
				Canvas.updateAllBones()
				Canvas.updateAllPositions()
			}
		}
		if (model.animations) {
			model.animations.forEach(ani => {
				var base_ani = new Animation()
				base_ani.uuid = ani.uuid
				base_ani.extend(ani).add()
				if (isApp && Format.animation_files) {
					base_ani.saved_name = base_ani.name
				}
			})
		}
		if (model.display !== undefined) {
			DisplayMode.loadJSON(model.display)
		}
		if (model.history) {
			Undo.history = model.history.slice()
			Undo.index = model.history_index
		}
		this.dispatchEvent('parsed', { model })
		Canvas.updateAll()

		console.groupEnd('Parse .ajmodel')
	},
})

const format = new ModelFormat({
	id: 'animated_java/ajmodel',
	name: 'Animated Java Model',
	description: 'Model format that exports to animated java edition armor_stand animations',
	show_on_start_screen: true,
	bone_rig: true,
	animation_mode: true,
	canvas_limit: false,
	rotate_cubes: true,
	rotation_limit: false,
	uv_rotation: true,
	centered_grid: true,
	animation_files: true,
	animated_textures: true,
	icon: 'icon-armor_stand',
	codec,
	onDeactivation() {
		settingsByUUID.set(Project.uuid, settings.toObject())
	},
})
