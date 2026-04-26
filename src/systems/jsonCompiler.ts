//// <reference types="blockbench-types"/>
/// <reference path="/var/mnt/ssd2/repos/snavesutit/blockbench-types/types/index.d.ts"/>
/// <reference path="../global.d.ts"/>

import { TextComponent } from 'book-and-quill'
import { getFsModule, PACKAGE } from '../constants'
import type { IBlueprintDisplayEntityConfigJSON } from '../formats/blueprint'
import { type defaultValues } from '../formats/blueprint/settings'
import type { EasingKey } from '../util/easing'
import { resolvePath } from '../util/fileUtil'
import { detectCircularReferences, mapObjEntries, scrubUndefined } from '../util/misc'
import { Variant } from '../variants'
import type { INodeTransform, IRenderedAnimation, IRenderedFrame } from './animationRenderer'
import { IntentionalExportError } from './errors'
import type {
	AnyRenderedNode,
	IRenderedModel,
	IRenderedRig,
	IRenderedVariant,
	IRenderedVariantModel,
} from './rigRenderer'

type ExportedNodetransform = Omit<INodeTransform, 'matrix' | 'decomposed'> & {
	matrix: number[]
	decomposed: {
		translation: ArrayVector3
		left_rotation: ArrayVector4
		scale: ArrayVector3
	}
}
type ExportedRenderedNode = Omit<
	AnyRenderedNode,
	'default_transform' | 'bounding_box' | 'configs' | 'storage_name'
> & {
	default_transform: ExportedNodetransform
	bounding_box?: { min: ArrayVector3; max: ArrayVector3 }
	configs?: Record<string, IBlueprintDisplayEntityConfigJSON>
}
type ExportedAnimationFrame = Omit<IRenderedFrame, 'node_transforms'> & {
	node_transforms: Record<string, ExportedNodetransform>
}
type ExportedBakedAnimation = Omit<
	IRenderedAnimation,
	'uuid' | 'frames' | 'modified_nodes' | 'storage_name'
> & {
	frames: ExportedAnimationFrame[]
	modified_nodes: string[]
}
interface ExportedKeyframe {
	time: number
	channel: string
	value?: [string, string, string]
	post?: [string, string, string]
	interpolation?:
		| {
				type: 'linear'
				easing: EasingKey
				easingArgs?: number[]
		  }
		| {
				type: 'bezier'
				bezier_linked?: boolean
				bezier_left_time?: ArrayVector3
				bezier_left_value?: ArrayVector3
				bezier_right_time?: ArrayVector3
				bezier_right_value?: ArrayVector3
		  }
		| {
				type: 'catmullrom'
		  }
		| {
				type: 'step'
		  }
	commands?: string
	variant?: string
	execute_condition?: string
	repeat?: boolean
	repeat_frequency?: number
}
type ExportedAnimator = ExportedKeyframe[]
interface ExportedDynamicAnimation {
	name: string
	loop_mode: 'once' | 'hold' | 'loop'
	duration: number
	excluded_nodes: string[]
	animators: Record<string, ExportedAnimator>
}
interface ExportedTexture {
	uuid: string
	name: string
	src: string
}
type ExportedVariantModel = Pick<
	IRenderedVariantModel,
	'custom_model_data' | 'resource_location' | 'item_model'
> & { model: IRenderedModel | null }
type ExportedVariant = Omit<IRenderedVariant, 'models'> & {
	/**
	 * A map of bone UUID -> IRenderedVariantModel
	 */
	models: Record<string, ExportedVariantModel>
}

export interface IExportedJSON {
	format_version: '2.0.0'
	exported_with: {
		name: string
		version: string
	}
	/**
	 * The Blueprint's Settings
	 */
	settings: {
		export_namespace: (typeof defaultValues)['blueprint_id']
		target_minecraft_version: (typeof defaultValues)['target_minecraft_version']
		display_item: (typeof defaultValues)['display_item']
		bounding_box: (typeof defaultValues)['render_box']
		// Resource Pack Settings
		custom_model_data_offset: (typeof defaultValues)['custom_model_data_offset']
		// Plugin Settings
		baked_animations: (typeof defaultValues)['baked_animations']
		interpolation_duration: (typeof defaultValues)['interpolation_duration']
		teleportation_duration: (typeof defaultValues)['teleportation_duration']
	}
	textures: Record<string, ExportedTexture>
	nodes: Record<string, ExportedRenderedNode>
	variants: Record<string, ExportedVariant>
	/**
	 * If `blueprint_settings.baked_animations` is true, this will be an array of `ExportedAnimation` objects. Otherwise, it will be an array of `AnimationUndoCopy` objects, just like the `.bbmodel`'s animation list.
	 */
	animations: Record<string, ExportedBakedAnimation> | Record<string, ExportedDynamicAnimation>
}

function transferKey(obj: any, oldKey: string, newKey: string) {
	if (!Object.prototype.hasOwnProperty.call(obj, oldKey)) return
	const value = obj[oldKey]
	if (value === undefined) return
	if (obj[newKey] === undefined) {
		obj[newKey] = value
	}
	delete obj[oldKey]
}

function serailizeKeyframe(kf: _Keyframe): ExportedKeyframe {
	const json: ExportedKeyframe = scrubUndefined({
		time: kf.time,
		channel: kf.channel,
		commands: kf.function,
		variant: kf.variant?.uuid,
		execute_condition: kf.execute_condition,
		repeat: kf.repeat,
		repeat_frequency: kf.repeat_frequency,
	})

	switch (json.channel) {
		case 'variant':
		case 'commands':
			break
		default: {
			json.value = [
				kf.get('x', 0).toString(),
				kf.get('y', 0).toString(),
				kf.get('z', 0).toString(),
			]
			json.interpolation = { type: kf.interpolation } as any
		}
	}

	if (json.interpolation) {
		switch (json.interpolation.type) {
			case 'linear': {
				json.interpolation.easing = kf.easing!
				if (kf.easingArgs?.length) json.interpolation.easingArgs = kf.easingArgs
				break
			}
			case 'bezier': {
				json.interpolation.bezier_linked = kf.bezier_linked
				json.interpolation.bezier_left_time = kf.bezier_left_time.slice() as ArrayVector3
				json.interpolation.bezier_left_value = kf.bezier_left_value.slice() as ArrayVector3
				json.interpolation.bezier_right_time = kf.bezier_right_time.slice() as ArrayVector3
				json.interpolation.bezier_right_value =
					kf.bezier_right_value.slice() as ArrayVector3
				break
			}
			case 'catmullrom': {
				break
			}
			case 'step': {
				break
			}
		}
	}

	if (kf.data_points.length === 2) {
		json.post = [
			kf.get('x', 1).toString(),
			kf.get('y', 1).toString(),
			kf.get('z', 1).toString(),
		]
	}

	return json
}

function serializeVariant(rig: IRenderedRig, variant: IRenderedVariant): ExportedVariant {
	const json: ExportedVariant = {
		...variant,
		models: mapObjEntries(variant.models, (uuid, model) => {
			const json: ExportedVariantModel = {
				model: model.model,
				custom_model_data: model.custom_model_data,
				resource_location: model.resource_location,
				item_model: model.item_model,
			}
			return [uuid, json]
		}),
	}
	return json
}

export function exportJSON(options: {
	rig: IRenderedRig
	animations: IRenderedAnimation[]
	displayItemPath: string
	textureExportFolder: string
	modelExportFolder: string
}) {
	const aj = Project!.animated_java
	const { rig, animations } = options

	console.log('Exporting JSON...', options)

	function serializeTexture(texture: Texture): ExportedTexture {
		return {
			uuid: texture.uuid,
			name: texture.name,
			src: texture.getDataURL(),
		}
	}

	const json: IExportedJSON = {
		format_version: '2.0.0',
		exported_with: {
			name: PACKAGE.name,
			version: PACKAGE.version,
		},
		settings: {
			export_namespace: aj.blueprint_id,
			target_minecraft_version: aj.target_minecraft_version,
			display_item: aj.display_item,
			bounding_box: aj.render_box,
			custom_model_data_offset: aj.custom_model_data_offset,
			baked_animations: aj.baked_animations,
			interpolation_duration: aj.interpolation_duration,
			teleportation_duration: aj.teleportation_duration,
		},
		textures: mapObjEntries(rig.textures, (id, texture) => [id, serializeTexture(texture)]),
		nodes: mapObjEntries(rig.nodes, (uuid, node) => [uuid, serailizeRenderedNode(node)]),
		variants: mapObjEntries(rig.variants, (uuid, variant) => [
			uuid,
			serializeVariant(rig, variant),
		]),
		animations: {},
	}

	if (aj.baked_animations) {
		for (const animation of animations) {
			json.animations[animation.uuid] = serializeAnimation(animation)
		}
	} else {
		for (const animation of Blockbench.Animation.all) {
			const animJSON: ExportedDynamicAnimation = {
				name: animation.name,
				loop_mode: animation.loop,
				duration: animation.length,
				// @ts-expect-error - Broken BB types
				excluded_nodes: animation.excluded_nodes.map(node => node.value),
				animators: {},
			}
			for (const [uuid, animator] of Object.entries(animation.animators)) {
				// Only include animators with keyframes
				// @ts-expect-error - Broken BB types
				if (animator.keyframes.length === 0) continue
				// @ts-expect-error - Broken BB types
				animJSON.animators[uuid] = animator.keyframes.map(serailizeKeyframe)
			}
			json.animations[animation.uuid] = animJSON
		}
	}

	console.log('Exported JSON:', json)
	if (detectCircularReferences(json)) {
		throw new Error('Circular references detected in exported JSON.')
	}
	console.log('Scrubbed:', scrubUndefined(json))

	let exportPath: string
	try {
		exportPath = resolvePath(aj.json_file)
	} catch (e) {
		throw new IntentionalExportError(
			`Failed to resolve export path <code>${aj.json_file}</code>: ${String(e)}`
		)
	}

	const { existsSync, mkdirSync, writeFileSync } = getFsModule()

	try {
		const dir = PathModule.dirname(exportPath)
		if (dir && dir !== '.' && !existsSync(dir)) {
			mkdirSync(dir, { recursive: true })
		}
		writeFileSync(exportPath, compileJSON(json).toString())
	} catch (e: any) {
		throw new IntentionalExportError(
			`Failed to write JSON file <code>${exportPath}</code>: ${String(e)}`
		)
	}
}

function serailizeNodeTransform(node: INodeTransform): ExportedNodetransform {
	const json: ExportedNodetransform = {
		matrix: node.matrix.elements,
		decomposed: {
			translation: node.decomposed.translation.toArray(),
			left_rotation: node.decomposed.left_rotation.toArray() as ArrayVector4,
			scale: node.decomposed.scale.toArray(),
		},
		pos: node.pos,
		rot: node.rot,
		head_rot: node.head_rot,
		scale: node.scale,
		interpolation: node.interpolation,
		function: node.function,
		function_execute_condition: node.function_execute_condition,
	}
	return json
}

function serailizeRenderedNode(node: AnyRenderedNode): ExportedRenderedNode {
	const json: any = { ...node }
	delete json.node
	delete json.parentNode
	delete json.path_name
	delete json.storage_name
	delete json.model
	transferKey(json, 'lineWidth', 'line_width')
	transferKey(json, 'backgroundColor', 'background_color')
	transferKey(json, 'backgroundAlpha', 'background_alpha')

	json.default_transform = serailizeNodeTransform(json.default_transform as INodeTransform)

	if (node.type !== 'struct' && (node as any).bounding_box) {
		json.bounding_box = {
			min: (node as any).bounding_box.min.toArray(),
			max: (node as any).bounding_box.max.toArray(),
		}
	}

	if ((node as any).configs) {
		json.configs = { ...(node as any).configs?.variants }
		const defaultVariant = Variant.getDefault()
		if ((node as any).configs?.default && defaultVariant) {
			json.configs[defaultVariant.uuid] = (node as any).configs.default
		}
	}

	switch (node.type) {
		case 'bone': {
			break
		}
		case 'text_display': {
			json.text = new TextComponent(node.text).toJSON()
			break
		}
	}
	return json as ExportedRenderedNode
}

function serializeAnimation(animation: IRenderedAnimation): ExportedBakedAnimation {
	const json: ExportedBakedAnimation = {
		name: animation.name,
		duration: animation.duration,
		loop_delay: animation.loop_delay,
		loop_mode: animation.loop_mode,
		frames: [],
		modified_nodes: Object.keys(animation.modified_nodes),
	}

	const frames: ExportedAnimationFrame[] = []
	for (const frame of animation.frames) {
		const nodeTransforms: Record<string, ExportedNodetransform> = {}
		for (const [uuid, nodeTransform] of Object.entries(frame.node_transforms)) {
			nodeTransforms[uuid] = serailizeNodeTransform(nodeTransform)
		}
		frames.push({ ...frame, node_transforms: nodeTransforms })
	}
	json.frames = frames

	return json
}
