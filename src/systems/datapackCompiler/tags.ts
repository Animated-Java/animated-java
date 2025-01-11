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
	export const PROJECT_ENTITY = (exportNamespace: string) => `aj.${exportNamespace}.entity`

	export const PROJECT_ROOT = (exportNamespace: string) => `aj.${exportNamespace}.root`
	export const PROJECT_ROOT_CHILD = (exportNamespace: string) =>
		`aj.${exportNamespace}.root.child`
	export const PROJECT_ROOT_CHILD_BONE = (exportNamespace: string) =>
		`aj.${exportNamespace}.root.child.bone`
	export const PROJECT_ROOT_CHILD_ITEM_DISPLAY = (exportNamespace: string) =>
		`aj.${exportNamespace}.root.child.item_display`
	export const PROJECT_ROOT_CHILD_BLOCK_DISPLAY = (exportNamespace: string) =>
		`aj.${exportNamespace}.root.child.block_display`
	export const PROJECT_ROOT_CHILD_TEXT_DISPLAY = (exportNamespace: string) =>
		`aj.${exportNamespace}.root.child.text_display`
	export const PROJECT_ROOT_CHILD_LOCATOR = (exportNamespace: string) =>
		`aj.${exportNamespace}.root.child.locator`
	export const PROJECT_ROOT_CHILD_CAMERA = (exportNamespace: string) =>
		`aj.${exportNamespace}.root.child.camera`
	export const PROJECT_ROOT_CHILD_DATA = (exportNamespace: string) =>
		`aj.${exportNamespace}.root.child.data`

	export const PROJECT_NODE = (exportNamespace: string) => `aj.${exportNamespace}.node`
	export const PROJECT_DISPLAY_NODE = (exportNamespace: string) =>
		`aj.${exportNamespace}.display_node`
	export const PROJECT_VANILLA_DISPLAY_NODE = (exportNamespace: string) =>
		`aj.${exportNamespace}.vanilla_display_node`
	export const PROJECT_BONE = (exportNamespace: string) => `aj.${exportNamespace}.bone`
	export const PROJECT_ITEM_DISPLAY = (exportNamespace: string) =>
		`aj.${exportNamespace}.item_display`
	export const PROJECT_BLOCK_DISPLAY = (exportNamespace: string) =>
		`aj.${exportNamespace}.block_display`
	export const PROJECT_TEXT_DISPLAY = (exportNamespace: string) =>
		`aj.${exportNamespace}.text_display`
	export const PROJECT_CAMERA = (exportNamespace: string) => `aj.${exportNamespace}.camera`
	export const PROJECT_LOCATOR = (exportNamespace: string) => `aj.${exportNamespace}.locator`
	export const PROJECT_DATA = (exportNamespace: string) => `aj.${exportNamespace}.data`

	export const PROJECT_NODE_NAMED = (exportNamespace: string, nodeName: string) =>
		`aj.${exportNamespace}.node.${nodeName}`
	export const PROJECT_BONE_NAMED = (exportNamespace: string, boneName: string) =>
		`aj.${exportNamespace}.bone.${boneName}`
	export const PROJECT_DISPLAY_NODE_NAMED = (exportNamespace: string, nodeName: string) =>
		`aj.${exportNamespace}.display_node.${nodeName}`
	export const PROJECT_ITEM_DISPLAY_NAMED = (exportNamespace: string, boneName: string) =>
		`aj.${exportNamespace}.item_display.${boneName}`
	export const PROJECT_BLOCK_DISPLAY_NAMED = (exportNamespace: string, boneName: string) =>
		`aj.${exportNamespace}.block_display.${boneName}`
	export const PROJECT_TEXT_DISPLAY_NAMED = (exportNamespace: string, boneName: string) =>
		`aj.${exportNamespace}.text_display.${boneName}`
	export const PROJECT_CAMERA_NAMED = (exportNamespace: string, cameraName: string) =>
		`aj.${exportNamespace}.camera.${cameraName}`
	export const PROJECT_LOCATOR_NAMED = (exportNamespace: string, locatorName: string) =>
		`aj.${exportNamespace}.locator.${locatorName}`

	export const PROJECT_BONE_CHILD = (exportNamespace: string, boneName: string) =>
		`aj.${exportNamespace}.bone.${boneName}.child`
	export const PROJECT_BONE_CHILD_BONE = (exportNamespace: string, boneName: string) =>
		`aj.${exportNamespace}.bone.${boneName}.child.bone`
	export const PROJECT_BONE_CHILD_ITEM_DISPLAY = (exportNamespace: string, boneName: string) =>
		`aj.${exportNamespace}.bone.${boneName}.child.item_display`
	export const PROJECT_BONE_CHILD_BLOCK_DISPLAY = (exportNamespace: string, boneName: string) =>
		`aj.${exportNamespace}.bone.${boneName}.child.block_display`
	export const PROJECT_BONE_CHILD_TEXT_DISPLAY = (exportNamespace: string, boneName: string) =>
		`aj.${exportNamespace}.bone.${boneName}.child.text_display`
	export const PROJECT_BONE_CHILD_LOCATOR = (exportNamespace: string, boneName: string) =>
		`aj.${exportNamespace}.bone.${boneName}.child.locator`
	export const PROJECT_BONE_CHILD_CAMERA = (exportNamespace: string, boneName: string) =>
		`aj.${exportNamespace}.bone.${boneName}.child.camera`

	export const PROJECT_BONE_DECENDANT = (exportNamespace: string, boneName: string) =>
		`aj.${exportNamespace}.bone.${boneName}.decendant`
	export const PROJECT_BONE_DECENDANT_BONE = (exportNamespace: string, boneName: string) =>
		`aj.${exportNamespace}.bone.${boneName}.decendant.bone`
	export const PROJECT_BONE_DECENDANT_ITEM_DISPLAY = (
		exportNamespace: string,
		boneName: string
	) => `aj.${exportNamespace}.bone.${boneName}.decendant.item_display`
	export const PROJECT_BONE_DECENDANT_BLOCK_DISPLAY = (
		exportNamespace: string,
		boneName: string
	) => `aj.${exportNamespace}.bone.${boneName}.decendant.block_display`
	export const PROJECT_BONE_DECENDANT_TEXT_DISPLAY = (
		exportNamespace: string,
		boneName: string
	) => `aj.${exportNamespace}.bone.${boneName}.decendant.text_display`
	export const PROJECT_BONE_DECENDANT_LOCATOR = (exportNamespace: string, boneName: string) =>
		`aj.${exportNamespace}.bone.${boneName}.decendant.locator`
	export const PROJECT_BONE_DECENDANT_CAMERA = (exportNamespace: string, boneName: string) =>
		`aj.${exportNamespace}.bone.${boneName}.decendant.camera`

	export const PROJECT_BONE_TREE = (exportNamespace: string, boneName: string) =>
		`aj.${exportNamespace}.bone.${boneName}.tree`
	export const PROJECT_BONE_TREE_BONE = (exportNamespace: string, boneName: string) =>
		`aj.${exportNamespace}.bone.${boneName}.tree.bone`

	// --------------------------------
	// region Misc Tags
	// --------------------------------
	export const ANIMATION_PLAYING = (exportNamespace: string, animationName: string) =>
		`aj.${exportNamespace}.animation.${animationName}.playing`
	export const TWEENING = (exportNamespace: string, animationName: string) =>
		`aj.${exportNamespace}.animation.${animationName}.tween_playing`
	export const VARIANT_APPLIED = (exportNamespace: string, variantName: string) =>
		`aj.${exportNamespace}.variant.${variantName}.applied`
	// Used to tell the set and apply frame functions to only apply the bone transforms, and ignore command/variant keyframes
	export const TRANSFORMS_ONLY = () => 'aj.transforms_only'
	export const OUTDATED_RIG_TEXT_DISPLAY = () => 'aj.outdated_rig_text_display'
}
