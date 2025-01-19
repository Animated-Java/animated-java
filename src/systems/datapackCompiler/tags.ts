import { NbtList, NbtString } from 'deepslate'
import { createTagPrefixFromBlueprintID } from '../../util/minecraftUtil'
import { IntentionalExportError } from '../exporter'
import { AnyRenderedNode, IRenderedRig } from '../rigRenderer'

export namespace TAGS {
	// --------------------------------
	// region Global Tags
	// --------------------------------
	export const NEW = () => 'aj.new'
	export const GLOBAL_ENTITY = () => 'aj.global.entity'

	export const GLOBAL_ROOT = () => 'aj.global.root'
	export const GLOBAL_ROOT_CHILD = () => 'aj.global.root.child'
	export const GLOBAL_ROOT_CHILD_BONE = () => 'aj.global.root.child.bone'
	export const GLOBAL_ROOT_CHILD_ITEM_DISPLAY = () => 'aj.global.root.child.item_display'
	export const GLOBAL_ROOT_CHILD_BLOCK_DISPLAY = () => 'aj.global.root.child.block_display'
	export const GLOBAL_ROOT_CHILD_TEXT_DISPLAY = () => 'aj.global.root.child.text_display'
	export const GLOBAL_ROOT_CHILD_LOCATOR = () => 'aj.global.root.child.locator'
	export const GLOBAL_ROOT_CHILD_CAMERA = () => 'aj.global.root.child.camera'
	export const GLOBAL_ROOT_CHILD_DATA = () => 'aj.global.root.child.data'

	export const GLOBAL_NODE = () => 'aj.global.node'
	export const GLOBAL_DISPLAY_NODE = () => 'aj.global.display_node'
	export const GLOBAL_VANILLA_DISPLAY_NODE = () => 'aj.global.vanilla_display_node'
	export const GLOBAL_BONE = () => 'aj.global.bone'
	export const GLOBAL_ITEM_DISPLAY = () => 'aj.global.item_display'
	export const GLOBAL_BLOCK_DISPLAY = () => 'aj.global.block_display'
	export const GLOBAL_TEXT_DISPLAY = () => 'aj.global.text_display'
	export const GLOBAL_CAMERA = () => 'aj.global.camera'
	export const GLOBAL_LOCATOR = () => 'aj.global.locator'
	export const GLOBAL_DATA = () => 'aj.global.data'

	export const GLOBAL_NODE_NAMED = (nodeName: string) => `aj.global.node.${nodeName}`
	export const GLOBAL_DISPLAY_NODE_NAMED = (nodeName: string) =>
		`aj.global.display_node.${nodeName}`
	export const GLOBAL_BONE_CHILD = (boneName: string) => `aj.global.bone.${boneName}.child`
	export const GLOBAL_BONE_CHILD_BONE = (boneName: string) =>
		`aj.global.bone.${boneName}.child.bone`
	export const GLOBAL_BONE_CHILD_ITEM_DISPLAY = (boneName: string) =>
		`aj.global.bone.${boneName}.child.item_display`
	export const GLOBAL_BONE_CHILD_BLOCK_DISPLAY = (boneName: string) =>
		`aj.global.bone.${boneName}.child.block_display`
	export const GLOBAL_BONE_CHILD_TEXT_DISPLAY = (boneName: string) =>
		`aj.global.bone.${boneName}.child.text_display`
	export const GLOBAL_BONE_CHILD_LOCATOR = (boneName: string) =>
		`aj.global.bone.${boneName}.child.locator`
	export const GLOBAL_BONE_CHILD_CAMERA = (boneName: string) =>
		`aj.global.bone.${boneName}.child.camera`

	export const GLOBAL_BONE_DECENDANT = (boneName: string) =>
		`aj.global.bone.${boneName}.decendant`
	export const GLOBAL_BONE_DECENDANT_BONE = (boneName: string) =>
		`aj.global.bone.${boneName}.decendant.bone`
	export const GLOBAL_BONE_DECENDANT_ITEM_DISPLAY = (boneName: string) =>
		`aj.global.bone.${boneName}.decendant.item_display`
	export const GLOBAL_BONE_DECENDANT_BLOCK_DISPLAY = (boneName: string) =>
		`aj.global.bone.${boneName}.decendant.block_display`
	export const GLOBAL_BONE_DECENDANT_TEXT_DISPLAY = (boneName: string) =>
		`aj.global.bone.${boneName}.decendant.text_display`
	export const GLOBAL_BONE_DECENDANT_LOCATOR = (boneName: string) =>
		`aj.global.bone.${boneName}.decendant.locator`
	export const GLOBAL_BONE_DECENDANT_CAMERA = (boneName: string) =>
		`aj.global.bone.${boneName}.decendant.camera`

	export const GLOBAL_BONE_TREE = (boneName: string) => `aj.global.bone.${boneName}.tree`
	export const GLOBAL_BONE_TREE_BONE = (boneName: string) =>
		`aj.global.bone.${boneName}.tree.bone`

	// --------------------------------
	// region Project Tags
	// --------------------------------
	export const PROJECT_ENTITY = () =>
		`aj.${createTagPrefixFromBlueprintID(Project!.animated_java.id)}.entity`

	export const PROJECT_ROOT = () =>
		`aj.${createTagPrefixFromBlueprintID(Project!.animated_java.id)}.root`
	export const PROJECT_ROOT_CHILD = () =>
		`aj.${createTagPrefixFromBlueprintID(Project!.animated_java.id)}.root.child`
	export const PROJECT_ROOT_CHILD_BONE = () =>
		`aj.${createTagPrefixFromBlueprintID(Project!.animated_java.id)}.root.child.bone`
	export const PROJECT_ROOT_CHILD_ITEM_DISPLAY = () =>
		`aj.${createTagPrefixFromBlueprintID(Project!.animated_java.id)}.root.child.item_display`
	export const PROJECT_ROOT_CHILD_BLOCK_DISPLAY = () =>
		`aj.${createTagPrefixFromBlueprintID(Project!.animated_java.id)}.root.child.block_display`
	export const PROJECT_ROOT_CHILD_TEXT_DISPLAY = () =>
		`aj.${createTagPrefixFromBlueprintID(Project!.animated_java.id)}.root.child.text_display`
	export const PROJECT_ROOT_CHILD_LOCATOR = () =>
		`aj.${createTagPrefixFromBlueprintID(Project!.animated_java.id)}.root.child.locator`
	export const PROJECT_ROOT_CHILD_CAMERA = () =>
		`aj.${createTagPrefixFromBlueprintID(Project!.animated_java.id)}.root.child.camera`
	export const PROJECT_ROOT_CHILD_DATA = () =>
		`aj.${createTagPrefixFromBlueprintID(Project!.animated_java.id)}.root.child.data`

	export const PROJECT_NODE = () =>
		`aj.${createTagPrefixFromBlueprintID(Project!.animated_java.id)}.node`
	export const PROJECT_DISPLAY_NODE = () =>
		`aj.${createTagPrefixFromBlueprintID(Project!.animated_java.id)}.display_node`
	export const PROJECT_VANILLA_DISPLAY_NODE = () =>
		`aj.${createTagPrefixFromBlueprintID(Project!.animated_java.id)}.vanilla_display_node`
	export const PROJECT_BONE = () =>
		`aj.${createTagPrefixFromBlueprintID(Project!.animated_java.id)}.bone`
	export const PROJECT_ITEM_DISPLAY = () =>
		`aj.${createTagPrefixFromBlueprintID(Project!.animated_java.id)}.item_display`
	export const PROJECT_BLOCK_DISPLAY = () =>
		`aj.${createTagPrefixFromBlueprintID(Project!.animated_java.id)}.block_display`
	export const PROJECT_TEXT_DISPLAY = () =>
		`aj.${createTagPrefixFromBlueprintID(Project!.animated_java.id)}.text_display`
	export const PROJECT_CAMERA = () =>
		`aj.${createTagPrefixFromBlueprintID(Project!.animated_java.id)}.camera`
	export const PROJECT_LOCATOR = () =>
		`aj.${createTagPrefixFromBlueprintID(Project!.animated_java.id)}.locator`
	export const PROJECT_DATA = () =>
		`aj.${createTagPrefixFromBlueprintID(Project!.animated_java.id)}.data`

	export const PROJECT_NODE_NAMED = (nodeName: string) =>
		`aj.${createTagPrefixFromBlueprintID(Project!.animated_java.id)}.node.${nodeName}`
	export const PROJECT_BONE_NAMED = (boneName: string) =>
		`aj.${createTagPrefixFromBlueprintID(Project!.animated_java.id)}.bone.${boneName}`
	export const PROJECT_DISPLAY_NODE_NAMED = (nodeName: string) =>
		`aj.${createTagPrefixFromBlueprintID(Project!.animated_java.id)}.display_node.${nodeName}`
	export const PROJECT_ITEM_DISPLAY_NAMED = (boneName: string) =>
		`aj.${createTagPrefixFromBlueprintID(Project!.animated_java.id)}.item_display.${boneName}`
	export const PROJECT_BLOCK_DISPLAY_NAMED = (boneName: string) =>
		`aj.${createTagPrefixFromBlueprintID(Project!.animated_java.id)}.block_display.${boneName}`
	export const PROJECT_TEXT_DISPLAY_NAMED = (boneName: string) =>
		`aj.${createTagPrefixFromBlueprintID(Project!.animated_java.id)}.text_display.${boneName}`
	export const PROJECT_CAMERA_NAMED = (cameraName: string) =>
		`aj.${createTagPrefixFromBlueprintID(Project!.animated_java.id)}.camera.${cameraName}`
	export const PROJECT_LOCATOR_NAMED = (locatorName: string) =>
		`aj.${createTagPrefixFromBlueprintID(Project!.animated_java.id)}.locator.${locatorName}`

	export const PROJECT_BONE_CHILD = (boneName: string) =>
		`aj.${createTagPrefixFromBlueprintID(Project!.animated_java.id)}.bone.${boneName}.child`
	export const PROJECT_BONE_CHILD_BONE = (boneName: string) =>
		`aj.${createTagPrefixFromBlueprintID(
			Project!.animated_java.id
		)}.bone.${boneName}.child.bone`
	export const PROJECT_BONE_CHILD_ITEM_DISPLAY = (boneName: string) =>
		`aj.${createTagPrefixFromBlueprintID(
			Project!.animated_java.id
		)}.bone.${boneName}.child.item_display`
	export const PROJECT_BONE_CHILD_BLOCK_DISPLAY = (boneName: string) =>
		`aj.${createTagPrefixFromBlueprintID(
			Project!.animated_java.id
		)}.bone.${boneName}.child.block_display`
	export const PROJECT_BONE_CHILD_TEXT_DISPLAY = (boneName: string) =>
		`aj.${createTagPrefixFromBlueprintID(
			Project!.animated_java.id
		)}.bone.${boneName}.child.text_display`
	export const PROJECT_BONE_CHILD_LOCATOR = (boneName: string) =>
		`aj.${createTagPrefixFromBlueprintID(
			Project!.animated_java.id
		)}.bone.${boneName}.child.locator`
	export const PROJECT_BONE_CHILD_CAMERA = (boneName: string) =>
		`aj.${createTagPrefixFromBlueprintID(
			Project!.animated_java.id
		)}.bone.${boneName}.child.camera`

	export const PROJECT_BONE_DECENDANT = (boneName: string) =>
		`aj.${createTagPrefixFromBlueprintID(Project!.animated_java.id)}.bone.${boneName}.decendant`
	export const PROJECT_BONE_DECENDANT_BONE = (boneName: string) =>
		`aj.${createTagPrefixFromBlueprintID(
			Project!.animated_java.id
		)}.bone.${boneName}.decendant.bone`
	export const PROJECT_BONE_DECENDANT_ITEM_DISPLAY = (boneName: string) =>
		`aj.${createTagPrefixFromBlueprintID(
			Project!.animated_java.id
		)}.bone.${boneName}.decendant.item_display`
	export const PROJECT_BONE_DECENDANT_BLOCK_DISPLAY = (boneName: string) =>
		`aj.${createTagPrefixFromBlueprintID(
			Project!.animated_java.id
		)}.bone.${boneName}.decendant.block_display`
	export const PROJECT_BONE_DECENDANT_TEXT_DISPLAY = (boneName: string) =>
		`aj.${createTagPrefixFromBlueprintID(
			Project!.animated_java.id
		)}.bone.${boneName}.decendant.text_display`
	export const PROJECT_BONE_DECENDANT_LOCATOR = (boneName: string) =>
		`aj.${createTagPrefixFromBlueprintID(
			Project!.animated_java.id
		)}.bone.${boneName}.decendant.locator`
	export const PROJECT_BONE_DECENDANT_CAMERA = (boneName: string) =>
		`aj.${createTagPrefixFromBlueprintID(
			Project!.animated_java.id
		)}.bone.${boneName}.decendant.camera`

	export const PROJECT_BONE_TREE = (boneName: string) =>
		`aj.${createTagPrefixFromBlueprintID(Project!.animated_java.id)}.bone.${boneName}.tree`
	export const PROJECT_BONE_TREE_BONE = (boneName: string) =>
		`aj.${createTagPrefixFromBlueprintID(Project!.animated_java.id)}.bone.${boneName}.tree.bone`

	// --------------------------------
	// region Misc Tags
	// --------------------------------
	export const ANIMATION_PLAYING = (animationName: string) =>
		`aj.${createTagPrefixFromBlueprintID(
			Project!.animated_java.id
		)}.animation.${animationName}.playing`
	export const TWEENING = (animationName: string) =>
		`aj.${createTagPrefixFromBlueprintID(
			Project!.animated_java.id
		)}.animation.${animationName}.tween_playing`
	export const VARIANT_APPLIED = (variantName: string) =>
		`aj.${createTagPrefixFromBlueprintID(
			Project!.animated_java.id
		)}.variant.${variantName}.applied`
	// Used to tell the set and apply frame functions to only apply the bone transforms, and ignore command/variant keyframes
	export const TRANSFORMS_ONLY = () => 'aj.transforms_only'
	export const OUTDATED_RIG_TEXT_DISPLAY = () => 'aj.outdated_rig_text_display'
}

// --------------------------------
// region Helper Functions
// --------------------------------
export function getNodeTags(node: AnyRenderedNode, rig: IRenderedRig): NbtList {
	const tags: string[] = []

	const parentNames: Array<{ name: string; type: string }> = []

	function recurseParents(node: AnyRenderedNode) {
		if (node.parent) {
			parentNames.push({
				name: rig.nodes[node.parent].path_name,
				type: rig.nodes[node.parent].type,
			})
			recurseParents(rig.nodes[node.parent])
		}
	}
	recurseParents(node)

	tags.push(
		// Global
		TAGS.NEW(),
		TAGS.GLOBAL_ENTITY(),
		TAGS.GLOBAL_NODE(),
		TAGS.GLOBAL_NODE_NAMED(node.path_name),
		// Project
		TAGS.PROJECT_ENTITY(),
		TAGS.PROJECT_NODE(),
		TAGS.PROJECT_NODE_NAMED(node.path_name)
	)

	if (!node.parent) {
		tags.push(TAGS.GLOBAL_ROOT_CHILD())
	}
	switch (node.type) {
		case 'bone': {
			tags.push(
				// Global
				TAGS.GLOBAL_DISPLAY_NODE_NAMED(node.path_name),
				TAGS.GLOBAL_BONE(),
				TAGS.GLOBAL_BONE_TREE(node.path_name), // Tree includes self
				TAGS.GLOBAL_BONE_TREE_BONE(node.path_name), // Tree includes self
				// Project
				TAGS.PROJECT_DISPLAY_NODE_NAMED(node.path_name),
				TAGS.PROJECT_BONE(),
				TAGS.PROJECT_BONE_NAMED(node.path_name),
				TAGS.PROJECT_BONE_TREE(node.path_name), // Tree includes self
				TAGS.PROJECT_BONE_TREE_BONE(node.path_name) // Tree includes self
			)
			if (!node.parent) {
				// Nodes without parents are assumed to be root nodes
				tags.push(TAGS.GLOBAL_ROOT_CHILD_BONE())
			} else {
				tags.push(
					// Global
					TAGS.GLOBAL_BONE_CHILD(parentNames[0].name),
					TAGS.GLOBAL_BONE_CHILD_BONE(parentNames[0].name),
					// Project
					TAGS.PROJECT_BONE_CHILD(parentNames[0].name),
					TAGS.PROJECT_BONE_CHILD_BONE(parentNames[0].name)
				)
			}
			for (const { name } of parentNames) {
				tags.push(
					// Global
					TAGS.GLOBAL_BONE_DECENDANT(name),
					TAGS.GLOBAL_BONE_DECENDANT_BONE(name),
					TAGS.GLOBAL_BONE_TREE(name),
					TAGS.GLOBAL_BONE_TREE_BONE(name),
					// Project
					TAGS.PROJECT_BONE_DECENDANT(name),
					TAGS.PROJECT_BONE_DECENDANT_BONE(name),
					TAGS.PROJECT_BONE_TREE(name),
					TAGS.PROJECT_BONE_TREE_BONE(name)
				)
			}
			break
		}
		case 'item_display': {
			tags.push(
				// Global
				TAGS.GLOBAL_DISPLAY_NODE_NAMED(node.path_name),
				TAGS.GLOBAL_ITEM_DISPLAY(),
				// Project
				TAGS.PROJECT_DISPLAY_NODE_NAMED(node.path_name),
				TAGS.PROJECT_ITEM_DISPLAY(),
				TAGS.PROJECT_ITEM_DISPLAY_NAMED(node.path_name)
			)
			if (!node.parent) {
				// Nodes without parents are assumed to be root nodes
				tags.push(TAGS.GLOBAL_ROOT_CHILD_ITEM_DISPLAY())
			} else {
				tags.push(
					// Global
					TAGS.GLOBAL_BONE_CHILD(parentNames[0].name),
					TAGS.GLOBAL_BONE_CHILD_ITEM_DISPLAY(parentNames[0].name),
					// Project
					TAGS.PROJECT_BONE_CHILD(parentNames[0].name),
					TAGS.PROJECT_BONE_CHILD_ITEM_DISPLAY(parentNames[0].name)
				)
			}
			for (const { name } of parentNames) {
				tags.push(
					// Global
					TAGS.GLOBAL_BONE_DECENDANT(name),
					TAGS.GLOBAL_BONE_DECENDANT_ITEM_DISPLAY(name),
					TAGS.GLOBAL_BONE_TREE(name),
					// Project
					TAGS.PROJECT_BONE_DECENDANT(name),
					TAGS.PROJECT_BONE_DECENDANT_ITEM_DISPLAY(name),
					TAGS.PROJECT_BONE_TREE(name)
				)
			}
			break
		}
		case 'block_display': {
			tags.push(
				// Global
				TAGS.GLOBAL_DISPLAY_NODE_NAMED(node.path_name),
				TAGS.GLOBAL_BLOCK_DISPLAY(),
				// Project
				TAGS.PROJECT_DISPLAY_NODE_NAMED(node.path_name),
				TAGS.PROJECT_BLOCK_DISPLAY(),
				TAGS.PROJECT_BLOCK_DISPLAY_NAMED(node.path_name)
			)
			if (!node.parent) {
				// Nodes without parents are assumed to be root nodes
				tags.push(TAGS.GLOBAL_ROOT_CHILD_BLOCK_DISPLAY())
			} else {
				tags.push(
					// Global
					TAGS.GLOBAL_BONE_CHILD(parentNames[0].name),
					TAGS.GLOBAL_BONE_CHILD_BLOCK_DISPLAY(parentNames[0].name),
					// Project
					TAGS.PROJECT_BONE_CHILD(parentNames[0].name),
					TAGS.PROJECT_BONE_CHILD_BLOCK_DISPLAY(parentNames[0].name)
				)
			}
			for (const { name } of parentNames) {
				tags.push(
					// Global
					TAGS.GLOBAL_BONE_DECENDANT(name),
					TAGS.GLOBAL_BONE_DECENDANT_BLOCK_DISPLAY(name),
					TAGS.GLOBAL_BONE_TREE(name),
					// Project
					TAGS.PROJECT_BONE_DECENDANT(name),
					TAGS.PROJECT_BONE_DECENDANT_BLOCK_DISPLAY(name),
					TAGS.PROJECT_BONE_TREE(name)
				)
			}
			break
		}
		case 'text_display': {
			tags.push(
				// Global
				TAGS.GLOBAL_DISPLAY_NODE_NAMED(node.path_name),
				TAGS.GLOBAL_TEXT_DISPLAY(),
				// Project
				TAGS.PROJECT_DISPLAY_NODE_NAMED(node.path_name),
				TAGS.PROJECT_TEXT_DISPLAY(),
				TAGS.PROJECT_TEXT_DISPLAY_NAMED(node.path_name)
			)
			if (!node.parent) {
				// Nodes without parents are assumed to be root nodes
				tags.push(TAGS.GLOBAL_ROOT_CHILD_TEXT_DISPLAY())
			} else {
				tags.push(
					// Global
					TAGS.GLOBAL_BONE_CHILD(parentNames[0].name),
					TAGS.GLOBAL_BONE_CHILD_TEXT_DISPLAY(parentNames[0].name),
					// Project
					TAGS.PROJECT_BONE_CHILD(parentNames[0].name),
					TAGS.PROJECT_BONE_CHILD_TEXT_DISPLAY(parentNames[0].name)
				)
			}
			for (const { name } of parentNames) {
				tags.push(
					// Global
					TAGS.GLOBAL_BONE_DECENDANT(name),
					TAGS.GLOBAL_BONE_DECENDANT_TEXT_DISPLAY(name),
					TAGS.GLOBAL_BONE_TREE(name),
					// Project
					TAGS.PROJECT_BONE_DECENDANT(name),
					TAGS.PROJECT_BONE_DECENDANT_TEXT_DISPLAY(name),
					TAGS.PROJECT_BONE_TREE(name)
				)
			}
			break
		}
		case 'locator': {
			tags.push(
				// Global
				TAGS.GLOBAL_LOCATOR(),
				// Project
				TAGS.PROJECT_LOCATOR(),
				TAGS.PROJECT_LOCATOR_NAMED(node.path_name)
			)
			if (!node.parent) {
				// Nodes without parents are assumed to be root nodes
				tags.push(TAGS.GLOBAL_ROOT_CHILD_LOCATOR())
			} else {
				tags.push(
					// Global
					TAGS.GLOBAL_BONE_CHILD(parentNames[0].name),
					TAGS.GLOBAL_BONE_CHILD_LOCATOR(parentNames[0].name),
					// Project
					TAGS.PROJECT_BONE_CHILD(parentNames[0].name),
					TAGS.PROJECT_BONE_CHILD_LOCATOR(parentNames[0].name)
				)
			}
			for (const { name } of parentNames) {
				tags.push(
					// Global
					TAGS.GLOBAL_BONE_DECENDANT(name),
					TAGS.GLOBAL_BONE_DECENDANT_LOCATOR(name),
					TAGS.GLOBAL_BONE_TREE(name),
					// Project
					TAGS.PROJECT_BONE_DECENDANT(name),
					TAGS.PROJECT_BONE_DECENDANT_LOCATOR(name),
					TAGS.PROJECT_BONE_TREE(name)
				)
			}
			break
		}
		case 'camera': {
			tags.push(
				// Global
				TAGS.GLOBAL_CAMERA(),
				// Project
				TAGS.PROJECT_CAMERA(),
				TAGS.PROJECT_CAMERA_NAMED(node.path_name)
			)
			if (!node.parent) {
				// Nodes without parents are assumed to be root nodes
				tags.push(TAGS.GLOBAL_ROOT_CHILD_CAMERA())
			} else {
				tags.push(
					// Global
					TAGS.GLOBAL_BONE_CHILD(parentNames[0].name),
					TAGS.GLOBAL_BONE_CHILD_CAMERA(parentNames[0].name),
					// Project
					TAGS.PROJECT_BONE_CHILD(parentNames[0].name),
					TAGS.PROJECT_BONE_CHILD_CAMERA(parentNames[0].name)
				)
			}
			for (const { name } of parentNames) {
				tags.push(
					// Global
					TAGS.GLOBAL_BONE_DECENDANT(name),
					TAGS.GLOBAL_BONE_DECENDANT_CAMERA(name),
					TAGS.GLOBAL_BONE_TREE(name),
					// Project
					TAGS.PROJECT_BONE_DECENDANT(name),
					TAGS.PROJECT_BONE_DECENDANT_CAMERA(name),
					TAGS.PROJECT_BONE_TREE(name)
				)
			}
			break
		}
		default: {
			throw new IntentionalExportError(
				`Attempted to get tags for an unknown node type: '${node.type}'!`
			)
		}
	}

	return new NbtList(tags.sort().map(v => new NbtString(v)))
}
