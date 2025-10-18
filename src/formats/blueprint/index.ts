import { type TextDisplay } from 'src/outliner/textDisplay'
import { type VanillaBlockDisplay } from 'src/outliner/vanillaBlockDisplay'
import { type VanillaItemDisplay } from 'src/outliner/vanillaItemDisplay'
import { mountSvelteComponent } from 'src/util/mountSvelteComponent'
import FormatPageSvelte from '../../components/formatPage.svelte'
import ProjectTitleSvelte from '../../components/projectTitle.svelte'
import { DisplayEntityConfig, LocatorConfig } from '../../nodeConfigs'
import EVENTS from '../../util/events'
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
	}
}

export const BLUEPRINT_FORMAT_ID = 'animated-java:format/blueprint'

/**
 * The serialized Variant Bone Config
 */
export interface IBlueprintDisplayEntityConfigJSON {
	on_apply_function?: DisplayEntityConfig['__onApplyFunction']
	billboard?: DisplayEntityConfig['billboard']
	override_brightness?: DisplayEntityConfig['overrideBrightness']
	brightness_override?: DisplayEntityConfig['brightnessOverride']
	enchanted?: DisplayEntityConfig['enchanted']
	glowing?: DisplayEntityConfig['glowing']
	override_glow_color?: DisplayEntityConfig['overrideGlowColor']
	glow_color?: DisplayEntityConfig['glowColor']
	invisible?: DisplayEntityConfig['invisible']
	shadow_radius?: DisplayEntityConfig['shadowRadius']
	shadow_strength?: DisplayEntityConfig['shadowStrength']
}

/**
 * The serialized Variant Locator Config
 */
export interface IBlueprintLocatorConfigJSON {
	use_entity?: LocatorConfig['useEntity']
	entity_type?: LocatorConfig['entityType']
	sync_passenger_rotation?: LocatorConfig['syncPassengerRotation']
	on_summon_function?: LocatorConfig['__onSummonFunction']
	on_remove_function?: LocatorConfig['__onRemoveFunction']
	on_tick_function?: LocatorConfig['__onTickFunction']
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

export function fixCubeRotation(cube: Cube) {
	const maxRotation = Math.max(...cube.rotation)
	const minRotation = Math.min(...cube.rotation)
	if (maxRotation <= 45 && minRotation >= -45) return
	// Use the rotation with the largest absolute value
	const rotation = Math.abs(maxRotation) >= Math.abs(minRotation) ? maxRotation : minRotation
	const axis = cube.rotation.indexOf(rotation)

	const previousSelected = Project!.selected_elements
	Project!.selected_elements = [cube]
	rotateOnAxis(() => rotation, axis, true)
	Project!.selected_elements = previousSelected
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

		fixCubeRotation(cube)
	}

	Canvas.updateAll()
}

export function getDefaultProjectSettings() {
	return { ...blueprintSettings.defaultValues }
}

EVENTS.UPDATE_VIEW.subscribe(() => {
	// Update the render box preview
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

		for (const display of [
			...AnimatedJava.TextDisplay.all,
			...AnimatedJava.VanillaItemDisplay.all,
			...AnimatedJava.VanillaBlockDisplay.all,
		]) {
			const box = new THREE.Box3().setFromObject(display.mesh)
			width = Math.max(
				width,
				Math.abs(box.min.x),
				Math.abs(box.min.z),
				Math.abs(box.max.x),
				Math.abs(box.max.z)
			)
			height = Math.max(height, box.max.y)
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
})

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
				template: `<div id="${BLUEPRINT_FORMAT_ID}/format_page_mount" style="display: flex; flex-direction: column; flex-grow: 1;"></div>`,
				mounted() {
					// Don't need to worry about unmounting since the whole panel gets replaced when switching formats
					mountSvelteComponent({
						component: FormatPageSvelte,
						target: `div[id="${BLUEPRINT_FORMAT_ID}/format_page_mount"]`,
					})
				},
			},
		},

		onSetup(project, newModel) {
			console.log('Animated Java Blueprint format setup')

			const defaults = getDefaultProjectSettings()
			if (newModel) {
				project.animated_java = defaults
				project.last_used_export_namespace = ''
			} else {
				project.animated_java = { ...defaults, ...project!.animated_java }
			}

			project.pluginMode = new Valuable(project.animated_java.enable_plugin_mode)

			requestAnimationFrame(() => {
				const projectIndex = ModelProject.all.indexOf(project)
				const projectTab = document.querySelectorAll('#tab_bar_list .project_tab')[
					projectIndex
				]

				if (!projectTab) {
					console.error('Could not find project tab for Animated Java Blueprint project!')
					return
				}
				projectTab.querySelector('i')?.remove()

				mountSvelteComponent({
					target: projectTab,
					prepend: true,
					component: ProjectTitleSvelte,
					props: { pluginMode: project.pluginMode },
				})

				for (const cube of Cube.all) {
					cube.setUVMode(false)
					fixCubeRotation(cube)
				}

				Canvas.updateAll()
			})
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
Language.data['format_category.animated_java'] = translate('format_category.animated_java')

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

export function hasNonElementSelection(): boolean {
	return (
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

export function updateRotationConstraints() {
	if (!activeProjectIsBlueprintFormat()) return
	const format = BLUEPRINT_FORMAT.get()!
	if (!format) {
		console.error('Animated Java Blueprint format is not registered!')
		return
	}

	// Rotation is always limited when selecting an element
	format.rotation_limit = !hasNonElementSelection()
	if (!projectTargetVersionIsAtLeast('1.21.6') /* < 1.21.6 */) {
		// But only snaps to 22.5 degree increments on versions before 1.21.6
		format.rotation_snap = format.rotation_limit
	}
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
EVENTS.UPDATE_SELECTION.subscribe(updateRotationConstraints)
EVENTS.SELECT_AJ_PROJECT.subscribe(() => {
	requestAnimationFrame(() => {
		updateRotationConstraints()
	})
})
EVENTS.UNSELECT_AJ_PROJECT.subscribe(project => {
	if (project.visualBoundingBox) scene.remove(project.visualBoundingBox)
})
