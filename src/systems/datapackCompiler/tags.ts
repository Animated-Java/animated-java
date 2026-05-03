import { NbtList, NbtString } from 'deepslate/lib/nbt'
import { IntentionalExportError } from '../errors'
import type { AnyRenderedNode, IRenderedRig } from '../rigRenderer'

export function makeTagSafe(value: string) {
	return value.replaceAll(/[:\/]/g, '.')
}

namespace TAGS {
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

	export const GLOBAL_NODE = () => 'aj.global.node'
	export const GLOBAL_DISPLAY_NODE = () => 'aj.global.display_node'
	export const GLOBAL_VANILLA_DISPLAY_NODE = () => 'aj.global.vanilla_display_node'
	export const GLOBAL_BONE = () => 'aj.global.bone'
	export const GLOBAL_ITEM_DISPLAY = () => 'aj.global.item_display'
	export const GLOBAL_BLOCK_DISPLAY = () => 'aj.global.block_display'
	export const GLOBAL_TEXT_DISPLAY = () => 'aj.global.text_display'
	export const GLOBAL_CAMERA = () => 'aj.global.camera'
	export const GLOBAL_LOCATOR = () => 'aj.global.locator'

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
	export const PROJECT_ENTITY = (blueprintId: string) => `${makeTagSafe(blueprintId)}.entity`

	export const PROJECT_ROOT = (blueprintId: string) => `${makeTagSafe(blueprintId)}.root`
	export const PROJECT_ROOT_CHILD = (blueprintId: string) =>
		`${makeTagSafe(blueprintId)}.root.child`
	export const PROJECT_ROOT_CHILD_BONE = (blueprintId: string) =>
		`${makeTagSafe(blueprintId)}.root.child.bone`
	export const PROJECT_ROOT_CHILD_ITEM_DISPLAY = (blueprintId: string) =>
		`${makeTagSafe(blueprintId)}.root.child.item_display`
	export const PROJECT_ROOT_CHILD_BLOCK_DISPLAY = (blueprintId: string) =>
		`${makeTagSafe(blueprintId)}.root.child.block_display`
	export const PROJECT_ROOT_CHILD_TEXT_DISPLAY = (blueprintId: string) =>
		`${makeTagSafe(blueprintId)}.root.child.text_display`
	export const PROJECT_ROOT_CHILD_LOCATOR = (blueprintId: string) =>
		`${makeTagSafe(blueprintId)}.root.child.locator`
	export const PROJECT_ROOT_CHILD_CAMERA = (blueprintId: string) =>
		`${makeTagSafe(blueprintId)}.root.child.camera`

	export const PROJECT_NODE = (blueprintId: string) => `${makeTagSafe(blueprintId)}.node`
	export const PROJECT_DISPLAY_NODE = (blueprintId: string) =>
		`${makeTagSafe(blueprintId)}.display_node`
	export const PROJECT_VANILLA_DISPLAY_NODE = (blueprintId: string) =>
		`${makeTagSafe(blueprintId)}.vanilla_display_node`
	export const PROJECT_BONE = (blueprintId: string) => `${makeTagSafe(blueprintId)}.bone`
	export const PROJECT_ITEM_DISPLAY = (blueprintId: string) =>
		`${makeTagSafe(blueprintId)}.item_display`
	export const PROJECT_BLOCK_DISPLAY = (blueprintId: string) =>
		`${makeTagSafe(blueprintId)}.block_display`
	export const PROJECT_TEXT_DISPLAY = (blueprintId: string) =>
		`${makeTagSafe(blueprintId)}.text_display`
	export const PROJECT_CAMERA = (blueprintId: string) => `${makeTagSafe(blueprintId)}.camera`
	export const PROJECT_LOCATOR = (blueprintId: string) => `${makeTagSafe(blueprintId)}.locator`

	export const PROJECT_NODE_NAMED = (blueprintId: string, nodeName: string) =>
		`${makeTagSafe(blueprintId)}.node.${nodeName}`
	export const PROJECT_BONE_NAMED = (blueprintId: string, boneName: string) =>
		`${makeTagSafe(blueprintId)}.bone.${boneName}`
	export const PROJECT_DISPLAY_NODE_NAMED = (blueprintId: string, nodeName: string) =>
		`${makeTagSafe(blueprintId)}.display_node.${nodeName}`
	export const PROJECT_ITEM_DISPLAY_NAMED = (blueprintId: string, boneName: string) =>
		`${makeTagSafe(blueprintId)}.item_display.${boneName}`
	export const PROJECT_BLOCK_DISPLAY_NAMED = (blueprintId: string, boneName: string) =>
		`${makeTagSafe(blueprintId)}.block_display.${boneName}`
	export const PROJECT_TEXT_DISPLAY_NAMED = (blueprintId: string, boneName: string) =>
		`${makeTagSafe(blueprintId)}.text_display.${boneName}`
	export const PROJECT_CAMERA_NAMED = (blueprintId: string, cameraName: string) =>
		`${makeTagSafe(blueprintId)}.camera.${cameraName}`
	export const PROJECT_LOCATOR_NAMED = (blueprintId: string, locatorName: string) =>
		`${makeTagSafe(blueprintId)}.locator.${locatorName}`

	export const PROJECT_BONE_CHILD = (blueprintId: string, boneName: string) =>
		`${makeTagSafe(blueprintId)}.bone.${boneName}.child`
	export const PROJECT_BONE_CHILD_BONE = (blueprintId: string, boneName: string) =>
		`${makeTagSafe(blueprintId)}.bone.${boneName}.child.bone`
	export const PROJECT_BONE_CHILD_ITEM_DISPLAY = (blueprintId: string, boneName: string) =>
		`${makeTagSafe(blueprintId)}.bone.${boneName}.child.item_display`
	export const PROJECT_BONE_CHILD_BLOCK_DISPLAY = (blueprintId: string, boneName: string) =>
		`${makeTagSafe(blueprintId)}.bone.${boneName}.child.block_display`
	export const PROJECT_BONE_CHILD_TEXT_DISPLAY = (blueprintId: string, boneName: string) =>
		`${makeTagSafe(blueprintId)}.bone.${boneName}.child.text_display`
	export const PROJECT_BONE_CHILD_LOCATOR = (blueprintId: string, boneName: string) =>
		`${makeTagSafe(blueprintId)}.bone.${boneName}.child.locator`
	export const PROJECT_BONE_CHILD_CAMERA = (blueprintId: string, boneName: string) =>
		`${makeTagSafe(blueprintId)}.bone.${boneName}.child.camera`

	export const PROJECT_BONE_DECENDANT = (blueprintId: string, boneName: string) =>
		`${makeTagSafe(blueprintId)}.bone.${boneName}.decendant`
	export const PROJECT_BONE_DECENDANT_BONE = (blueprintId: string, boneName: string) =>
		`${makeTagSafe(blueprintId)}.bone.${boneName}.decendant.bone`
	export const PROJECT_BONE_DECENDANT_ITEM_DISPLAY = (blueprintId: string, boneName: string) =>
		`${makeTagSafe(blueprintId)}.bone.${boneName}.decendant.item_display`
	export const PROJECT_BONE_DECENDANT_BLOCK_DISPLAY = (blueprintId: string, boneName: string) =>
		`${makeTagSafe(blueprintId)}.bone.${boneName}.decendant.block_display`
	export const PROJECT_BONE_DECENDANT_TEXT_DISPLAY = (blueprintId: string, boneName: string) =>
		`${makeTagSafe(blueprintId)}.bone.${boneName}.decendant.text_display`
	export const PROJECT_BONE_DECENDANT_LOCATOR = (blueprintId: string, boneName: string) =>
		`${makeTagSafe(blueprintId)}.bone.${boneName}.decendant.locator`
	export const PROJECT_BONE_DECENDANT_CAMERA = (blueprintId: string, boneName: string) =>
		`${makeTagSafe(blueprintId)}.bone.${boneName}.decendant.camera`

	export const PROJECT_BONE_TREE = (blueprintId: string, boneName: string) =>
		`${makeTagSafe(blueprintId)}.bone.${boneName}.tree`
	export const PROJECT_BONE_TREE_BONE = (blueprintId: string, boneName: string) =>
		`${makeTagSafe(blueprintId)}.bone.${boneName}.tree.bone`

	// --------------------------------
	// region Misc Tags
	// --------------------------------
	export const ANIMATION_PLAYING = (blueprintId: string, animationName: string) =>
		`${makeTagSafe(blueprintId)}.animation.${animationName}.playing`
	export const TWEENING = (blueprintId: string, animationName: string) =>
		`${makeTagSafe(blueprintId)}.animation.${animationName}.tween_playing`
	export const VARIANT_APPLIED = (blueprintId: string, variantName: string) =>
		`${makeTagSafe(blueprintId)}.variant.${variantName}.applied`
	// Used to tell the set and apply frame functions to only apply the bone transforms, and ignore command/variant keyframes
	export const TRANSFORMS_ONLY = () => 'aj.transforms_only'
	export const EFFECTS_ONLY = () => 'aj.effects_only'
	export const OUTDATED_RIG_TEXT_DISPLAY = () => 'aj.outdated_rig_text_display'
}

export default TAGS

export function getRootEntityTags(): NbtList {
	const tags: string[] = [
		...Project!.animated_java.custom_rig_entity_tags.split(',').map(t => t.trim()),
		TAGS.NEW(),
		TAGS.GLOBAL_ENTITY(),
		TAGS.GLOBAL_ROOT(),
		TAGS.PROJECT_ENTITY(Project!.animated_java.blueprint_id),
		TAGS.PROJECT_ROOT(Project!.animated_java.blueprint_id),
	]

	return new NbtList(tags.sort().map(v => new NbtString(v)))
}

// region getNodeTags
export function getNodeTags(node: AnyRenderedNode, rig: IRenderedRig): NbtList {
	const tags: string[] = [
		...Project!.animated_java.custom_rig_entity_tags.split(',').map(t => t.trim()),
	]

	const parentNames: Array<{ name: string; type: string }> = []

	function recurseParents(n: AnyRenderedNode) {
		if (n.parent === 'root') {
			// Root is ignored
		} else if (n.parent) {
			parentNames.push({
				name: rig.nodes[n.parent].storage_name,
				type: rig.nodes[n.parent].type,
			})
			recurseParents(rig.nodes[n.parent])
		}
	}
	recurseParents(node)

	const hasParent = node.parent && node.parent !== 'root'

	tags.push(
		// Global
		TAGS.NEW(),
		TAGS.GLOBAL_ENTITY(),
		TAGS.GLOBAL_NODE(),
		TAGS.GLOBAL_NODE_NAMED(node.storage_name),
		// Project
		TAGS.PROJECT_ENTITY(Project!.animated_java.blueprint_id),
		TAGS.PROJECT_NODE(Project!.animated_java.blueprint_id),
		TAGS.PROJECT_NODE_NAMED(Project!.animated_java.blueprint_id, node.storage_name)
	)

	if (!hasParent) {
		tags.push(TAGS.GLOBAL_ROOT_CHILD())
	}
	switch (node.type) {
		case 'bone': {
			tags.push(
				// Global
				TAGS.GLOBAL_DISPLAY_NODE_NAMED(node.storage_name),
				TAGS.GLOBAL_BONE(),
				TAGS.GLOBAL_BONE_TREE(node.storage_name), // Tree includes self
				TAGS.GLOBAL_BONE_TREE_BONE(node.storage_name), // Tree includes self
				// Project
				TAGS.PROJECT_DISPLAY_NODE_NAMED(
					Project!.animated_java.blueprint_id,
					node.storage_name
				),
				TAGS.PROJECT_BONE(Project!.animated_java.blueprint_id),
				TAGS.PROJECT_BONE_NAMED(Project!.animated_java.blueprint_id, node.storage_name),
				TAGS.PROJECT_BONE_TREE(Project!.animated_java.blueprint_id, node.storage_name), // Tree includes self
				TAGS.PROJECT_BONE_TREE_BONE(Project!.animated_java.blueprint_id, node.storage_name) // Tree includes self
			)
			if (!hasParent) {
				// Nodes without parents are assumed to be root nodes
				tags.push(TAGS.GLOBAL_ROOT_CHILD_BONE())
			} else {
				tags.push(
					// Global
					TAGS.GLOBAL_BONE_CHILD(parentNames[0].name),
					TAGS.GLOBAL_BONE_CHILD_BONE(parentNames[0].name),
					// Project
					TAGS.PROJECT_BONE_CHILD(
						Project!.animated_java.blueprint_id,
						parentNames[0].name
					),
					TAGS.PROJECT_BONE_CHILD_BONE(
						Project!.animated_java.blueprint_id,
						parentNames[0].name
					)
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
					TAGS.PROJECT_BONE_DECENDANT(Project!.animated_java.blueprint_id, name),
					TAGS.PROJECT_BONE_DECENDANT_BONE(Project!.animated_java.blueprint_id, name),
					TAGS.PROJECT_BONE_TREE(Project!.animated_java.blueprint_id, name),
					TAGS.PROJECT_BONE_TREE_BONE(Project!.animated_java.blueprint_id, name)
				)
			}
			break
		}
		case 'item_display': {
			tags.push(
				// Global
				TAGS.GLOBAL_DISPLAY_NODE_NAMED(node.storage_name),
				TAGS.GLOBAL_ITEM_DISPLAY(),
				// Project
				TAGS.PROJECT_DISPLAY_NODE_NAMED(
					Project!.animated_java.blueprint_id,
					node.storage_name
				),
				TAGS.PROJECT_ITEM_DISPLAY(Project!.animated_java.blueprint_id),
				TAGS.PROJECT_ITEM_DISPLAY_NAMED(
					Project!.animated_java.blueprint_id,
					node.storage_name
				)
			)
			if (!hasParent) {
				// Nodes without parents are assumed to be root nodes
				tags.push(TAGS.GLOBAL_ROOT_CHILD_ITEM_DISPLAY())
			} else {
				tags.push(
					// Global
					TAGS.GLOBAL_BONE_CHILD(parentNames[0].name),
					TAGS.GLOBAL_BONE_CHILD_ITEM_DISPLAY(parentNames[0].name),
					// Project
					TAGS.PROJECT_BONE_CHILD(
						Project!.animated_java.blueprint_id,
						parentNames[0].name
					),
					TAGS.PROJECT_BONE_CHILD_ITEM_DISPLAY(
						Project!.animated_java.blueprint_id,
						parentNames[0].name
					)
				)
			}
			for (const { name } of parentNames) {
				tags.push(
					// Global
					TAGS.GLOBAL_BONE_DECENDANT(name),
					TAGS.GLOBAL_BONE_DECENDANT_ITEM_DISPLAY(name),
					TAGS.GLOBAL_BONE_TREE(name),
					// Project
					TAGS.PROJECT_BONE_DECENDANT(Project!.animated_java.blueprint_id, name),
					TAGS.PROJECT_BONE_DECENDANT_ITEM_DISPLAY(
						Project!.animated_java.blueprint_id,
						name
					),
					TAGS.PROJECT_BONE_TREE(Project!.animated_java.blueprint_id, name)
				)
			}
			break
		}
		case 'block_display': {
			tags.push(
				// Global
				TAGS.GLOBAL_DISPLAY_NODE_NAMED(node.storage_name),
				TAGS.GLOBAL_BLOCK_DISPLAY(),
				// Project
				TAGS.PROJECT_DISPLAY_NODE_NAMED(
					Project!.animated_java.blueprint_id,
					node.storage_name
				),
				TAGS.PROJECT_BLOCK_DISPLAY(Project!.animated_java.blueprint_id),
				TAGS.PROJECT_BLOCK_DISPLAY_NAMED(
					Project!.animated_java.blueprint_id,
					node.storage_name
				)
			)
			if (!hasParent) {
				// Nodes without parents are assumed to be root nodes
				tags.push(TAGS.GLOBAL_ROOT_CHILD_BLOCK_DISPLAY())
			} else {
				tags.push(
					// Global
					TAGS.GLOBAL_BONE_CHILD(parentNames[0].name),
					TAGS.GLOBAL_BONE_CHILD_BLOCK_DISPLAY(parentNames[0].name),
					// Project
					TAGS.PROJECT_BONE_CHILD(
						Project!.animated_java.blueprint_id,
						parentNames[0].name
					),
					TAGS.PROJECT_BONE_CHILD_BLOCK_DISPLAY(
						Project!.animated_java.blueprint_id,
						parentNames[0].name
					)
				)
			}
			for (const { name } of parentNames) {
				tags.push(
					// Global
					TAGS.GLOBAL_BONE_DECENDANT(name),
					TAGS.GLOBAL_BONE_DECENDANT_BLOCK_DISPLAY(name),
					TAGS.GLOBAL_BONE_TREE(name),
					// Project
					TAGS.PROJECT_BONE_DECENDANT(Project!.animated_java.blueprint_id, name),
					TAGS.PROJECT_BONE_DECENDANT_BLOCK_DISPLAY(
						Project!.animated_java.blueprint_id,
						name
					),
					TAGS.PROJECT_BONE_TREE(Project!.animated_java.blueprint_id, name)
				)
			}
			break
		}
		case 'text_display': {
			tags.push(
				// Global
				TAGS.GLOBAL_DISPLAY_NODE_NAMED(node.storage_name),
				TAGS.GLOBAL_TEXT_DISPLAY(),
				// Project
				TAGS.PROJECT_DISPLAY_NODE_NAMED(
					Project!.animated_java.blueprint_id,
					node.storage_name
				),
				TAGS.PROJECT_TEXT_DISPLAY(Project!.animated_java.blueprint_id),
				TAGS.PROJECT_TEXT_DISPLAY_NAMED(
					Project!.animated_java.blueprint_id,
					node.storage_name
				)
			)
			if (!hasParent) {
				// Nodes without parents are assumed to be root nodes
				tags.push(TAGS.GLOBAL_ROOT_CHILD_TEXT_DISPLAY())
			} else {
				tags.push(
					// Global
					TAGS.GLOBAL_BONE_CHILD(parentNames[0].name),
					TAGS.GLOBAL_BONE_CHILD_TEXT_DISPLAY(parentNames[0].name),
					// Project
					TAGS.PROJECT_BONE_CHILD(
						Project!.animated_java.blueprint_id,
						parentNames[0].name
					),
					TAGS.PROJECT_BONE_CHILD_TEXT_DISPLAY(
						Project!.animated_java.blueprint_id,
						parentNames[0].name
					)
				)
			}
			for (const { name } of parentNames) {
				tags.push(
					// Global
					TAGS.GLOBAL_BONE_DECENDANT(name),
					TAGS.GLOBAL_BONE_DECENDANT_TEXT_DISPLAY(name),
					TAGS.GLOBAL_BONE_TREE(name),
					// Project
					TAGS.PROJECT_BONE_DECENDANT(Project!.animated_java.blueprint_id, name),
					TAGS.PROJECT_BONE_DECENDANT_TEXT_DISPLAY(
						Project!.animated_java.blueprint_id,
						name
					),
					TAGS.PROJECT_BONE_TREE(Project!.animated_java.blueprint_id, name)
				)
			}
			break
		}
		case 'locator': {
			tags.push(
				// Global
				TAGS.GLOBAL_LOCATOR(),
				// Project
				TAGS.PROJECT_LOCATOR(Project!.animated_java.blueprint_id),
				TAGS.PROJECT_LOCATOR_NAMED(Project!.animated_java.blueprint_id, node.storage_name)
			)
			if (!hasParent) {
				// Nodes without parents are assumed to be root nodes
				tags.push(TAGS.GLOBAL_ROOT_CHILD_LOCATOR())
			} else {
				tags.push(
					// Global
					TAGS.GLOBAL_BONE_CHILD(parentNames[0].name),
					TAGS.GLOBAL_BONE_CHILD_LOCATOR(parentNames[0].name),
					// Project
					TAGS.PROJECT_BONE_CHILD(
						Project!.animated_java.blueprint_id,
						parentNames[0].name
					),
					TAGS.PROJECT_BONE_CHILD_LOCATOR(
						Project!.animated_java.blueprint_id,
						parentNames[0].name
					)
				)
			}
			for (const { name } of parentNames) {
				tags.push(
					// Global
					TAGS.GLOBAL_BONE_DECENDANT(name),
					TAGS.GLOBAL_BONE_DECENDANT_LOCATOR(name),
					TAGS.GLOBAL_BONE_TREE(name),
					// Project
					TAGS.PROJECT_BONE_DECENDANT(Project!.animated_java.blueprint_id, name),
					TAGS.PROJECT_BONE_DECENDANT_LOCATOR(Project!.animated_java.blueprint_id, name),
					TAGS.PROJECT_BONE_TREE(Project!.animated_java.blueprint_id, name)
				)
			}
			break
		}
		case 'camera': {
			tags.push(
				// Global
				TAGS.GLOBAL_CAMERA(),
				// Project
				TAGS.PROJECT_CAMERA(Project!.animated_java.blueprint_id),
				TAGS.PROJECT_CAMERA_NAMED(Project!.animated_java.blueprint_id, node.storage_name)
			)
			if (!hasParent) {
				// Nodes without parents are assumed to be root nodes
				tags.push(TAGS.GLOBAL_ROOT_CHILD_CAMERA())
			} else {
				tags.push(
					// Global
					TAGS.GLOBAL_BONE_CHILD(parentNames[0].name),
					TAGS.GLOBAL_BONE_CHILD_CAMERA(parentNames[0].name),
					// Project
					TAGS.PROJECT_BONE_CHILD(
						Project!.animated_java.blueprint_id,
						parentNames[0].name
					),
					TAGS.PROJECT_BONE_CHILD_CAMERA(
						Project!.animated_java.blueprint_id,
						parentNames[0].name
					)
				)
			}
			for (const { name } of parentNames) {
				tags.push(
					// Global
					TAGS.GLOBAL_BONE_DECENDANT(name),
					TAGS.GLOBAL_BONE_DECENDANT_CAMERA(name),
					TAGS.GLOBAL_BONE_TREE(name),
					// Project
					TAGS.PROJECT_BONE_DECENDANT(Project!.animated_java.blueprint_id, name),
					TAGS.PROJECT_BONE_DECENDANT_CAMERA(Project!.animated_java.blueprint_id, name),
					TAGS.PROJECT_BONE_TREE(Project!.animated_java.blueprint_id, name)
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
