import { sanitizeStorageKey } from 'src/util/minecraftUtil'
import { registerCodec } from 'src/util/moddingTools'
import { translate } from 'src/util/translation'
import { Variant } from 'src/variants'
import { PACKAGE } from '../../constants'
import * as ModelDatFixerUpper from './dfu'
import {
	BLUEPRINT_FORMAT,
	BLUEPRINT_FORMAT_ID,
	getDefaultProjectSettings,
	IBlueprintFormatJSON,
	ICollectionJSON,
} from './format'
import * as blueprintSettings from './settings'

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

			if (Array.isArray(model.collections)) {
				for (const collectionJSON of model.collections) {
					new Collection(collectionJSON, collectionJSON.uuid).add()
				}
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

			if (Collection.all.length > 0) {
				model.collections = Collection.all.map(
					collection => collection.getSaveCopy() as ICollectionJSON
				)
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
