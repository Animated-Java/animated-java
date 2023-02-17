import { BlockbenchMod } from './mods'
import { getDefaultProjectSettings } from './projectSettings'

const FORMAT_VERSION = '1.0'

function processVersionMigration(model: any) {
	if (!model.meta.format_version) {
		model.meta.format_version = FORMAT_VERSION
	}

	if (model.meta.model_format === 'animatedJava/ajmodel') {
		model.meta.model_format = 'animated_java/ajmodel'
		model.meta.format_version = FORMAT_VERSION
	}
}

function addProjectToRecentProjects(file: FileResult) {
	var name = pathToName(file.path, true)
	if (file.path && isApp && !file.no_file) {
		let project = Project
		Project!.save_path = file.path
		Project!.name = pathToName(name, false)
		addRecentProject({
			name,
			path: file.path,
			icon: ajModelFormat.icon,
		})
		setTimeout(() => {
			if (Project == project) updateRecentProjectThumbnail()
		}, 200)
	}
}

function loadAnimatedJavaProjectSettings(model: any) {
	if (!Project) return

	Project.animated_java_settings = getDefaultProjectSettings()
	if (!(model.animated_java && model.animated_java.settings)) return

	console.log('Loading Animated Java project settings...')

	for (const [name, setting] of Object.entries(Project.animated_java_settings)) {
		if (model.animated_java.settings[name])
			setting.push({
				value: model.animated_java.settings[name],
			})
	}
}

function exportAnimatedJavaProjectSettings(): any {
	if (!(Project && Project.animated_java_settings)) return
	const exported: any = {}
	for (const [name, setting] of Object.entries(Project.animated_java_settings)) {
		exported[name] = setting.pull().value
	}
	return exported
}

export const ajCodec = new Blockbench.Codec('ajmodel', {
	name: 'Animated Java Model',
	remember: true,
	extension: 'ajmodel',
	load_filter: {
		extensions: ['ajmodel', 'mcmodel'],
		type: 'json',
	},

	load(model, file, add) {
		setupProject(ajModelFormat)
		Project!.save_path = file.path
		Project!.export_path = file.path
		addProjectToRecentProjects(file)
		ajCodec.parse!(model, file.path)
	},

	parse(model, path, add) {
		console.log('Parsing Animated Java model...')
		ajCodec.dispatchEvent('parse', { model, path })

		processVersionMigration(model)

		loadAnimatedJavaProjectSettings(model)

		ajCodec.dispatchEvent('parsed', { model })
	},

	compile(options) {
		console.log('Compiling Animated Java model...')
		const model = {
			meta: {
				format: ajCodec.format.id,
				format_version: FORMAT_VERSION,
			},
			animated_java: {
				settings: exportAnimatedJavaProjectSettings(),
			},
		}
		const content = compileJSON(model)

		// Blockbench.dispatchEvent('save_project', { model, options })
		ajCodec.dispatchEvent('compile', { model, options })

		return content
	},

	export() {
		console.log('Exporting Animated Java model...')
		Blockbench.export({
			resource_id: 'animated_java.export',
			type: 'json',
			extensions: [ajCodec.extension],
			content: ajCodec.compile(),
			custom_writer: (content, path) => {
				ajCodec.write(content, path)
			},
		})
	},

	fileName() {
		return Project?.animated_java_settings!.project_name.pull().value
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
	onStart() {},
	codec: ajCodec,

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
ajCodec.format = ajModelFormat

const saveProjectAction = BarItems.save_project as Action
const oldSaveProjectFunction = saveProjectAction.click
new BlockbenchMod({
	id: 'animated_java:save_project',
	inject() {
		saveProjectAction.click = (event: Event) => {
			if (Project && Project.format === ajModelFormat) {
				ajCodec.write(ajCodec.compile(), Project.save_path)
			} else {
				oldSaveProjectFunction(event)
			}
		}
	},
	extract() {
		saveProjectAction.click = oldSaveProjectFunction
	},
})

const saveProjectAsAction = BarItems.save_project_as as Action
const oldSaveProjectAsFunction = saveProjectAsAction.click
new BlockbenchMod({
	id: 'animated_java:save_project_as',
	inject() {
		saveProjectAsAction.click = (event: Event) => {
			if (Project && Project.format === ajModelFormat) {
				ajCodec.export()
			} else {
				oldSaveProjectAsFunction(event)
			}
		}
	},
	extract() {
		saveProjectAsAction.click = oldSaveProjectAsFunction
	},
})

const exportOverAction = BarItems.export_over as Action
const oldExportOverFunction = exportOverAction.click
new BlockbenchMod({
	id: 'animated_java:export_over',
	inject() {
		exportOverAction.click = (event: Event) => {
			if (Project && Project.format === ajModelFormat) {
				if (Format) {
					saveTextures()
					if (Project.export_path) {
						ajCodec.write(ajCodec.compile(), Project.export_path)
					} else if (!Project.save_path) {
						ajCodec.export()
					}
				}
				if (Blockbench.Animation.all.length) {
					;(BarItems.save_all_animations as Action).trigger()
				}
			} else {
				oldExportOverFunction(event)
			}
		}
	},
	extract() {
		exportOverAction.click = oldExportOverFunction
	},
})
