//// <reference types="blockbench-types"/>
/// <reference path="D:/github-repos/snavesutit/blockbench-types/types/index.d.ts"/>
/// <reference path="../global.d.ts"/>

import { IBlueprintVariantJSON } from '../blueprintFormat'
import { type defaultValues } from '../blueprintSettings'
import { EasingKey } from '../util/easing'
import { detectCircularReferences, scrubUndefined } from '../util/misc'
import { Variant } from '../variants'
import type { IAnimationNode, IRenderedAnimation, IRenderedFrame } from './animationRenderer'
import type {
	AnyRenderedNode,
	INodeStructure,
	IRenderedBoneVariant,
	IRenderedModel,
	IRenderedRig,
} from './rigRenderer'

type ExportedAnimationNode = Omit<IAnimationNode, 'node' | 'matrix' | 'transformation'> & {
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
	'node' | 'parentNode' | 'model' | 'boundingBox'
> & {
	boundingBox?: { min: ArrayVector3; max: ArrayVector3 }
}
type ExportedAnimationFrame = Omit<IRenderedFrame, 'nodes'> & { nodes: ExportedAnimationNode[] }
type ExportedBakedAnimation = Omit<IRenderedAnimation, 'frames' | 'includedNodes'> & {
	frames: ExportedAnimationFrame[]
	includedNodes: string[]
}
type ExportedAnimator = {
	name: string
	type: string
	keyframes: Array<{
		uuid: string
		time: number
		channel: string
		data_points: KeyframeDataPoint[]
		interpolation: 'linear' | 'bezier' | 'catmullrom' | 'step'
		bezier_linked?: boolean
		bezier_left_time?: ArrayVector3
		bezier_left_value?: ArrayVector3
		bezier_right_time?: ArrayVector3
		bezier_right_value?: ArrayVector3
		easing: EasingKey
		easingArgs?: number[]
	}>
}
type ExportedDynamicAnimation = {
	name: string
	uuid: string
	loop_mode: 'once' | 'hold' | 'loop'
	duration: number
	excluded_nodes: string[]
	animators: Record<string, ExportedAnimator>
}
interface ISerializedTexture {
	name: string
	expectedPath: string
	src: string
}

export interface IExportedJSON {
	blueprint_settings: { [T in keyof typeof defaultValues]: (typeof defaultValues)[T] }
	resources: {
		textureExportFolder: string
		modelExportFolder: string
		displayItemPath: string
		models: Record<string, IRenderedModel>
		variant_models: Record<string, Record<string, IRenderedBoneVariant>>
		textures: Record<string, ISerializedTexture>
	}
	rig: {
		default_pose: ExportedAnimationNode[]
		node_map: Record<string, ExportedRenderedNode>
		node_structure: INodeStructure
		variants: Record<string, IBlueprintVariantJSON>
	}
	/**
	 * If `blueprint_settings.baked_animations` is true, this will be an array of `ExportedAnimation` objects. Otherwise, it will be an array of `AnimationUndoCopy` objects, just like the `.bbmodel`'s animation list.
	 */
	animations: ExportedBakedAnimation[] | ExportedDynamicAnimation[]
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

	function serializeTexture(texture: Texture): ISerializedTexture {
		return {
			name: texture.name,
			expectedPath: PathModule.join(
				textureExportFolder,
				texture.name.endsWith('.png') ? texture.name : texture.name + '.png'
			),
			src: texture.getDataURL(),
		}
	}

	const json: IExportedJSON = {
		blueprint_settings: aj,
		resources: {
			textureExportFolder,
			modelExportFolder,
			displayItemPath,
			models: rig.models,
			variant_models: rig.variantModels,
			textures: Object.fromEntries(
				Object.entries(rig.textures).map(([key, texture]) => [
					key,
					serializeTexture(texture),
				])
			),
		},
		rig: {
			default_pose: rig.defaultPose.map(serailizeAnimationNode),
			node_map: Object.fromEntries(
				Object.entries(rig.nodeMap).map(([key, node]) => [key, serailizeRenderedNode(node)])
			),
			node_structure: rig.nodeStructure,
			variants: Object.fromEntries(
				Variant.all.map(variant => [variant.uuid, variant.toJSON()])
			),
		},
		animations: aj.baked_animations
			? animations.map(serializeAnimation)
			: Blockbench.Animation.all.map(a => {
					const json: ExportedDynamicAnimation = {
						uuid: a.uuid,
						name: a.name,
						loop_mode: a.loop,
						duration: a.length,
						excluded_nodes: a.excluded_nodes.map(node => node.value),
						animators: {},
					}
					for (const [uuid, animator] of Object.entries(a.animators)) {
						json.animators[uuid] = {
							name: animator.name,
							type: animator.type as string,
							keyframes: animator.keyframes.map(kf => {
								const json: any = kf.getUndoCopy(true)
								delete json.color
								if (
									Array.isArray(json.easingArgs) &&
									json.easingArgs.length === 0
								) {
									delete json.easingArgs
								}
								// eslint-disable-next-line @typescript-eslint/no-unsafe-return
								return json
							}),
						}
					}
					return json
			  }),
	}

	console.log('Exported JSON:', json)
	if (detectCircularReferences(json)) {
		throw new Error('Circular references detected in exported JSON.')
	}
	console.log('Scrubbed:', scrubUndefined(json))

	fs.writeFileSync(aj.json_file, compileJSON(json).toString())
}

function serailizeRenderedNode(node: AnyRenderedNode): ExportedRenderedNode {
	const json: any = { ...node }
	delete json.node
	delete json.parentNode
	delete json.model
	if (node.type === 'bone') {
		json.boundingBox = {
			min: node.boundingBox.min.toArray(),
			max: node.boundingBox.max.toArray(),
		}
	}
	return json as ExportedRenderedNode
}

function serailizeAnimationNode(node: IAnimationNode): ExportedAnimationNode {
	const json: ExportedAnimationNode = {
		type: node.type,
		name: node.name,
		uuid: node.uuid,
		matrix: node.matrix.elements,
		transformation: {
			translation: node.transformation.translation.toArray(),
			left_rotation: node.transformation.left_rotation.toArray() as ArrayVector4,
			scale: node.transformation.scale.toArray(),
		},
		pos: node.pos,
		rot: node.rot,
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
		storageSafeName: animation.storageSafeName,
		duration: animation.duration,
		loopDelay: animation.loopDelay,
		loopMode: animation.loopMode,
		frames: [],
		includedNodes: [],
	}

	const frames: ExportedAnimationFrame[] = []
	for (const frame of animation.frames) {
		const nodes: ExportedAnimationNode[] = frame.nodes.map(serailizeAnimationNode)
		frames.push({ ...frame, nodes })
	}
	json.frames = frames

	json.includedNodes = animation.includedNodes.map(serailizeRenderedNode).map(node => node.uuid)

	return json
}
