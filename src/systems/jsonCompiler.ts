//// <reference types="blockbench-types"/>
/// <reference path="D:/github-repos/snavesutit/blockbench-types/types/index.d.ts"/>
/// <reference path="../global.d.ts"/>

import type { IBlueprintBoneConfigJSON, IBlueprintVariantJSON } from '../blueprintFormat'
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
import { detectCircularReferences, scrubUndefined } from '../util/misc'
import { Variant } from '../variants'
import type { INodeTransform, IRenderedAnimation, IRenderedFrame } from './animationRenderer'
import type {
	AnyRenderedNode,
	INodeStructure,
	IRenderedBoneVariant,
	IRenderedModel,
	IRenderedRig,
} from './rigRenderer'

type ExportedNodetransform = Omit<
	INodeTransform,
	'type' | 'name' | 'uuid' | 'node' | 'matrix' | 'transformation'
> & {
	matrix: number[]
	transformation: {
		translation: ArrayVector3
		left_rotation: ArrayVector4
		scale: ArrayVector3
	}
	pos: ArrayVector3
	rot: ArrayVector3
	scale: ArrayVector3
}
type ExportedRenderedNode = Omit<
	AnyRenderedNode,
	'node' | 'parentNode' | 'model' | 'boundingBox' | 'configs'
> & {
	defaultTransform: ExportedNodetransform
	boundingBox?: { min: ArrayVector3; max: ArrayVector3 }
	configs?: Record<string, IBlueprintBoneConfigJSON>
}
type ExportedAnimationFrame = Omit<IRenderedFrame, 'nodes' | 'node_transforms'> & {
	node_transforms: Record<string, ExportedNodetransform>
}
type ExportedBakedAnimation = Omit<IRenderedAnimation, 'uuid' | 'frames' | 'includedNodes'> & {
	frames: ExportedAnimationFrame[]
	includedNodes: string[]
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
interface ISerializedTexture {
	name: string
	id: string
	expectedPath: string
	src: string
}

export interface IExportedJSON {
	blueprint_settings: {
		export_namespace: (typeof defaultValues)['export_namespace']
		show_bounding_box: (typeof defaultValues)['show_bounding_box']
		auto_bounding_box: (typeof defaultValues)['auto_bounding_box']
		bounding_box: (typeof defaultValues)['bounding_box']
		// Export Settings
		resource_pack_export_mode: (typeof defaultValues)['resource_pack_export_mode']
		// Resource Pack Settings
		display_item: (typeof defaultValues)['display_item']
		custom_model_data_offset: (typeof defaultValues)['custom_model_data_offset']
		enable_advanced_resource_pack_settings: (typeof defaultValues)['enable_advanced_resource_pack_settings']
		resource_pack: (typeof defaultValues)['resource_pack']
		display_item_path: (typeof defaultValues)['display_item_path']
		model_folder: (typeof defaultValues)['model_folder']
		texture_folder: (typeof defaultValues)['texture_folder']
		// Plugin Settings
		baked_animations: (typeof defaultValues)['baked_animations']
		json_file: (typeof defaultValues)['json_file']
	}
	resources: {
		textureExportFolder: string
		modelExportFolder: string
		displayItemPath: string
		models: Record<string, IRenderedModel>
		variant_models: Record<string, Record<string, IRenderedBoneVariant>>
		textures: Record<string, ISerializedTexture>
	}
	rig: {
		node_map: Record<string, ExportedRenderedNode>
		node_structure: INodeStructure
		variants: Record<string, IBlueprintVariantJSON>
	}
	/**
	 * If `blueprint_settings.baked_animations` is true, this will be an array of `ExportedAnimation` objects. Otherwise, it will be an array of `AnimationUndoCopy` objects, just like the `.bbmodel`'s animation list.
	 */
	animations: Record<string, ExportedBakedAnimation> | Record<string, ExportedDynamicAnimation>
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

export function exportJSON(options: {
	rig: IRenderedRig
	animations: IRenderedAnimation[]
	displayItemPath: string
	textureExportFolder: string
	modelExportFolder: string
}) {
	const aj = Project!.animated_java
	const { rig, animations, displayItemPath, textureExportFolder, modelExportFolder } = options

	console.log('Exporting JSON...', options)

	function serializeTexture(id: string, texture: Texture): ISerializedTexture {
		return {
			name: texture.name,
			id,
			expectedPath: PathModule.join(
				textureExportFolder,
				texture.name.endsWith('.png') ? texture.name : texture.name + '.png'
			),
			src: texture.getDataURL(),
		}
	}

	const blueprintSettings = { ...aj } as any
	delete blueprintSettings.enable_plugin_mode
	delete blueprintSettings.data_pack_export_mode
	delete blueprintSettings.enable_advanced_data_pack_settings
	delete blueprintSettings.data_pack
	delete blueprintSettings.summon_commands
	delete blueprintSettings.interpolation_duration
	delete blueprintSettings.teleportation_duration
	delete blueprintSettings.use_storage_for_animation

	const defaultTransforms = Object.fromEntries(
		rig.defaultTransforms.map(v => [v.uuid, serailizeNodeTransform(v)])
	)

	const json: IExportedJSON = {
		blueprint_settings: blueprintSettings,
		resources: {
			textureExportFolder,
			modelExportFolder,
			displayItemPath,
			models: rig.models,
			variant_models: rig.variantModels,
			textures: Object.fromEntries(
				Object.entries(rig.textures).map(([id, texture]) => [
					texture.uuid,
					serializeTexture(id, texture),
				])
			),
		},
		rig: {
			node_map: Object.fromEntries(
				Object.entries(rig.nodeMap).map(([key, node]) => [
					key,
					serailizeRenderedNode(node, defaultTransforms),
				])
			),
			node_structure: rig.nodeStructure,
			variants: Object.fromEntries(
				Variant.all.map(variant => [variant.uuid, variant.toJSON()])
			),
		},
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

function serailizeRenderedNode(
	node: AnyRenderedNode,
	defaultTransforms?: Record<string, ExportedNodetransform>
): ExportedRenderedNode {
	const json: any = { ...node }
	delete json.node
	delete json.parentNode
	delete json.model
	if (node.type === 'bone') {
		json.boundingBox = {
			min: node.boundingBox.min.toArray(),
			max: node.boundingBox.max.toArray(),
		}
		delete json.configs
		json.configs = { ...node.configs.variants }
		const defaultVariant = Variant.getDefault()
		if (node.configs.default && defaultVariant) {
			json.configs[defaultVariant.uuid] = node.configs.default
		}
	}
	if (defaultTransforms) {
		json.defaultTransform = defaultTransforms[node.uuid]
	}
	return json as ExportedRenderedNode
}

function serailizeNodeTransform(node: INodeTransform): ExportedNodetransform {
	const json: ExportedNodetransform = {
		matrix: node.matrix.elements,
		transformation: {
			translation: node.transformation.translation.toArray(),
			left_rotation: node.transformation.left_rotation.toArray() as ArrayVector4,
			scale: node.transformation.scale.toArray(),
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

function serializeAnimation(animation: IRenderedAnimation): ExportedBakedAnimation {
	const json: ExportedBakedAnimation = {
		name: animation.name,
		safeName: animation.safeName,
		duration: animation.duration,
		loopDelay: animation.loopDelay,
		loopMode: animation.loopMode,
		frames: [],
		includedNodes: [],
	}

	const frames: ExportedAnimationFrame[] = []
	for (const frame of animation.frames) {
		const node_transforms: Record<string, ExportedNodetransform> = Object.fromEntries(
			frame.node_transforms.map(v => [v.uuid, serailizeNodeTransform(v)])
		)
		frames.push({ ...frame, node_transforms })
	}
	json.frames = frames

	json.includedNodes = animation.includedNodes
		.map(v => serailizeRenderedNode(v))
		.map(node => node.uuid)

	return json
}
