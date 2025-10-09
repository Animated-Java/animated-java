import { type TextDisplay } from 'src/outliner/textDisplay'
import { type VanillaBlockDisplay } from 'src/outliner/vanillaBlockDisplay'
import { type VanillaItemDisplay } from 'src/outliner/vanillaItemDisplay'
import FormatPageSvelte from '../../components/formatPage.svelte'
import ProjectTitleSvelte from '../../components/projectTitle.svelte'
import { type BillboardMode, BoneConfig, LocatorConfig } from '../../nodeConfigs'
import EVENTS from '../../util/events'
import { injectSvelteComponent } from '../../util/injectSvelteComponent'
import { sanitizeStorageKey } from '../../util/minecraftUtil'
import { registerModelFormat } from '../../util/moddingTools'
import { Valuable } from '../../util/stores'
import { translate } from '../../util/translation'
import { Variant } from '../../variants'
import { BLUEPRINT_CODEC } from './codec'
import type { BlueprintSettings } from './settings'
import * as blueprintSettings from './settings'

declare global {
	interface ModelProject {
		animated_java: BlueprintSettings
		last_used_export_namespace: string
		visualBoundingBox?: THREE.LineSegments
		pluginMode: Valuable<boolean>
		transparentTexture: Texture

		variants: Variant[]
		textDisplays: TextDisplay[]
		vanillaItemDisplays: VanillaItemDisplay[]
		vanillaBlockDisplays: VanillaBlockDisplay[]

		loadingPromises?: Array<Promise<unknown>>
	}
}

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
	on_summon_function?: LocatorConfig['__onSummonFunction']
	on_tick_function?: LocatorConfig['__onTickFunction']
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

export interface ICollectionJSON {
	name?: string
	uuid?: string
	export_codec?: string
	export_path?: string
	children?: string[]
	visibility?: boolean
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
	collections?: ICollectionJSON[]
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
		!!AnimatedJava.TextDisplay.selected.length ||
		!!AnimatedJava.VanillaItemDisplay.selected.length ||
		!!AnimatedJava.VanillaBlockDisplay.selected.length ||
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
