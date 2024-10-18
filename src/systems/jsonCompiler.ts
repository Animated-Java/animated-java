//// <reference types="blockbench-types"/>
/// <reference path="D:/github-repos/snavesutit/blockbench-types/types/index.d.ts"/>
/// <reference path="../global.d.ts"/>

import type { IBlueprintBoneConfigJSON } from '../blueprintFormat'
import { type defaultValues } from '../blueprintSettings'
import {
	getKeyframeCommands,
	getKeyframeExecuteCondition,
	getKeyframeRepeat,
	getKeyframeRepeatFrequency,
	getKeyframeVariant,
} from '../mods/customKeyframesMod'
import { EasingKey } from '../util/easing'
import { resolvePath } from '../util/fileUtil'
import { detectCircularReferences, mapObjEntries, scrubUndefined } from '../util/misc'
import { Variant } from '../variants'
import type { INodeTransform, IRenderedAnimation, IRenderedFrame } from './animationRenderer'
import type {
	AnyRenderedNode,
	IRenderedModel,
	IRenderedRig,
	IRenderedVariant,
	IRenderedVariantModel,
} from './rigRenderer'

type ExportedNodetransform = Omit<
	INodeTransform,
	'type' | 'name' | 'uuid' | 'node' | 'matrix' | 'decomposed' | 'executeCondition'
> & {
	matrix: number[]
	decomposed: {
		translation: ArrayVector3
		left_rotation: ArrayVector4
		scale: ArrayVector3
	}
	pos: ArrayVector3
	rot: ArrayVector3
	scale: ArrayVector3
	execute_condition?: string
}
type ExportedRenderedNode = Omit<
	AnyRenderedNode,
	'node' | 'parentNode' | 'model' | 'boundingBox' | 'configs' | 'baseScale' | 'safe_name'
> & {
	default_transform: ExportedNodetransform
	bounding_box?: { min: ArrayVector3; max: ArrayVector3 }
	configs?: Record<string, IBlueprintBoneConfigJSON>
}
type ExportedAnimationFrame = Omit<IRenderedFrame, 'nodes' | 'node_transforms'> & {
	node_transforms: Record<string, ExportedNodetransform>
}
type ExportedBakedAnimation = Omit<
	IRenderedAnimation,
	'uuid' | 'frames' | 'modified_nodes' | 'safe_name'
> & {
	frames: ExportedAnimationFrame[]
	modified_nodes: string[]
}
type ExportedKeyframe = {
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
type ExportedDynamicAnimation = {
	name: string
	loop_mode: 'once' | 'hold' | 'loop'
	duration: number
	excluded_nodes: string[]
	animators: Record<string, ExportedAnimator>
}
interface ExportedTexture {
	name: string
	src: string
}
type ExportedVariantModel = Omit<
	IRenderedVariantModel,
	'model_path' | 'resource_location' | 'item_model'
> & {
	model: IRenderedModel | null
	custom_model_data: number
}
type ExportedVariant = Omit<IRenderedVariant, 'models'> & {
	/**
	 * A map of bone UUID -> IRenderedVariantModel
	 */
	models: Record<string, ExportedVariantModel>
}

export interface IExportedJSON {
	/**
	 * The Blueprint's Settings
	 */
	settings: {
		export_namespace: (typeof defaultValues)['export_namespace']
		bounding_box: (typeof defaultValues)['bounding_box']
		// Resource Pack Settings
		custom_model_data_offset: (typeof defaultValues)['custom_model_data_offset']
		// Plugin Settings
		baked_animations: (typeof defaultValues)['baked_animations']
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
	obj[newKey] = obj[oldKey]
	delete obj[oldKey]
}

function serailizeKeyframe(kf: _Keyframe): ExportedKeyframe {
	const json = {
		time: kf.time,
		channel: kf.channel,
		commands: getKeyframeCommands(kf),
		variant: getKeyframeVariant(kf),
		execute_condition: getKeyframeExecuteCondition(kf),
		repeat: getKeyframeRepeat(kf),
		repeat_frequency: getKeyframeRepeatFrequency(kf),
	} as ExportedKeyframe

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
			name: texture.name,
			src: texture.getDataURL(),
		}
	}

	const json: IExportedJSON = {
		settings: {
			export_namespace: aj.export_namespace,
			bounding_box: aj.bounding_box,
			custom_model_data_offset: aj.custom_model_data_offset,
			baked_animations: aj.baked_animations,
		},
		textures: mapObjEntries(rig.textures, (_, texture) => [
			texture.uuid,
			serializeTexture(texture),
		]),
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
				excluded_nodes: animation.excluded_nodes.map(node => node.value),
				animators: {},
			}
			for (const [uuid, animator] of Object.entries(animation.animators)) {
				// Only include animators with keyframes
				if (animator.keyframes.length === 0) continue
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
		console.log(`Failed to resolve export path '${aj.json_file}'`)
		console.error(e)
		return
	}

	fs.writeFileSync(exportPath, compileJSON(json).toString())
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
		commands: node.commands,
		execute_condition: node.execute_condition,
	}
	return json
}

function serailizeRenderedNode(node: AnyRenderedNode): ExportedRenderedNode {
	const json: any = { ...node }
	delete json.node
	delete json.parentNode
	delete json.safe_name
	delete json.model
	transferKey(json, 'lineWidth', 'line_width')
	transferKey(json, 'backgroundColor', 'background_color')
	transferKey(json, 'backgroundAlpha', 'background_alpha')

	json.default_transform = serailizeNodeTransform(json.default_transform as INodeTransform)
	switch (node.type) {
		case 'bone': {
			delete json.boundingBox
			json.bounding_box = {
				min: node.bounding_box.min.toArray(),
				max: node.bounding_box.max.toArray(),
			}
			delete json.configs
			json.configs = { ...node.configs?.variants }
			const defaultVariant = Variant.getDefault()
			if (node.configs?.default && defaultVariant) {
				json.configs[defaultVariant.uuid] = node.configs.default
			}
			break
		}
		case 'text_display': {
			json.text = node.text?.toJSON()
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
