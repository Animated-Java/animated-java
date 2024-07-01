//// <reference types="blockbench-types"/>
/// <reference path="D:/github-repos/snavesutit/blockbench-types/types/index.d.ts"/>
/// <reference path="../global.d.ts"/>

import { type defaultValues } from '../blueprintSettings'
import { detectCircularReferences, scrubUndefined } from '../util/misc'
import type { IAnimationNode, IRenderedAnimation, IRenderedFrame } from './animationRenderer'
import type {
	AnyRenderedNode,
	INodeStructure,
	IRenderedBoneVariant,
	IRenderedModel,
	IRenderedRig,
} from './rigRenderer'

type ExportedAnimationNode = IAnimationNode & { node: never }
type ExportedRenderedNode = AnyRenderedNode & { node: never; parentNode: never }
type ExportedAnimationFrame = IRenderedFrame & { nodes: ExportedAnimationNode[] }
type ExportedAnimation = IRenderedAnimation & {
	frames: ExportedAnimationFrame[]
	includedNodes: ExportedRenderedNode[]
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
	}
	/**
	 * If `blueprint_settings.baked_animations` is true, this will be an array of `ExportedAnimation` objects. Otherwise, it will be an array of `AnimationUndoCopy` objects, just like the `.bbmodel`'s animation list.
	 */
	animations: ExportedAnimation[] | AnimationUndoCopy[]
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
		},
		animations: aj.baked_animations
			? animations.map(serializeAnimation)
			: Blockbench.Animation.all.map(a => a.getUndoCopy({ bone_names: true }, true)),
	}

	console.log('Exported JSON:', json)
	if (detectCircularReferences(json)) {
		throw new Error('Circular references detected in exported JSON.')
	}
	console.log('Scrubbed:', scrubUndefined(json))

	fs.writeFileSync(aj.json_file, compileJSON(json).toString())
}

function serailizeRenderedNode(node: AnyRenderedNode): ExportedRenderedNode {
	const json = { ...node } as ExportedRenderedNode
	delete json.node
	delete json.parentNode
	return json
}

function serailizeAnimationNode(node: IAnimationNode): ExportedAnimationNode {
	const json = { ...node } as ExportedAnimationNode
	delete json.node
	return json
}

function serializeAnimation(animation: IRenderedAnimation): ExportedAnimation {
	const json = { ...animation } as ExportedAnimation

	const frames: ExportedAnimationFrame[] = []
	for (const frame of animation.frames) {
		const nodes: ExportedAnimationNode[] = frame.nodes.map(serailizeAnimationNode)
		frames.push({ ...frame, nodes })
	}
	json.frames = frames

	json.includedNodes = animation.includedNodes.map(serailizeRenderedNode)

	return json
}
