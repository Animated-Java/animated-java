import {
	IBlueprintCameraConfigJSON,
	type IBlueprintBoneConfigJSON,
	IBlueprintLocatorConfigJSON,
	IBlueprintTextDisplayConfigJSON,
	IBlueprintVariantJSON,
} from '../blueprintFormat'
import { BoneConfig } from '../nodeConfigs'
import { Alignment, TextDisplay } from '../outliner/textDisplay'
import {
	IMinecraftResourceLocation,
	parseResourcePackPath,
	toSafeFuntionName,
} from '../util/minecraftUtil'
import { Variant } from '../variants'
import {
	correctSceneAngle,
	getFrame,
	restoreSceneAngle,
	updatePreview,
	type INodeTransform,
} from './animationRenderer'
import * as crypto from 'crypto'
import { JsonText } from './minecraft/jsonText'
import { VanillaItemDisplay } from '../outliner/vanillaItemDisplay'
import { VanillaBlockDisplay } from '../outliner/vanillaBlockDisplay'
import { IntentionalExportError } from './exporter'

export interface IRenderedFace {
	uv: number[]
	rotation?: number
	texture: string
	cullface?: string
	tintindex?: number
}

export interface IRenderedElement {
	from: number[]
	to: number[]
	shade?: boolean
	rotation?:
		| {
				angle: number
				axis: string
				origin: number[]
				rescale?: boolean
		  }
		| number[]
	faces?: Record<string, IRenderedFace>
}

/**
 * An actual Minecraft model
 */
export interface IRenderedModel {
	parent?: string
	textures: Record<string, string>
	elements?: IRenderedElement[]
	display?: {
		head: { rotation: [0, 180, 0] }
	}
}

export interface IRenderedNode {
	type: string
	name: string
	safe_name: string
	uuid: string
	parent?: string
	/**
	 * The default transformation of the node
	 */
	default_transform: INodeTransform
}

export interface ICamera extends OutlinerElement {
	name: string
	path: string
	position: ArrayVector3
	rotation: ArrayVector3
	linked_preview: string
	camera_linked: boolean
	visibility: boolean
	config: IBlueprintCameraConfigJSON
	preview_controller: NodePreviewController
}

export interface IRenderedNodes {
	Bone: IRenderedNode & {
		type: 'bone'
		bounding_box: THREE.Box3
		/**
		 * The base scale of the bone, used to offset any rescaling done to the bone's model due to exceeding the 3x3x3 model size limit.
		 */
		base_scale: number
		configs?: {
			default?: IBlueprintBoneConfigJSON
			variants: Record<string, IBlueprintBoneConfigJSON>
		}
	}
	Struct: IRenderedNode & {
		type: 'struct'
	}
	Camera: IRenderedNode & {
		type: 'camera'
		config?: IBlueprintCameraConfigJSON
	}
	Locator: IRenderedNode & {
		type: 'locator'
		config?: IBlueprintLocatorConfigJSON
	}
	TextDisplay: IRenderedNode & {
		type: 'text_display'
		text?: JsonText
		line_width: number
		background_color: string
		background_alpha: number
		align: Alignment
		shadow: boolean
		see_through: boolean
		/**
		 * The base scale of the bone, used to offset any rescaling done to the bone's model due to exceeding the 3x3x3 model size limit.
		 */
		base_scale: number
		config?: IBlueprintTextDisplayConfigJSON
	}
	ItemDisplay: IRenderedNode & {
		type: 'item_display'
		item: string
		item_display: string
		/**
		 * The base scale of the bone, used to offset any rescaling done to the bone's model due to exceeding the 3x3x3 model size limit.
		 */
		base_scale: number
		config?: IBlueprintBoneConfigJSON
	}
	BlockDisplay: IRenderedNode & {
		type: 'block_display'
		block: string
		/**
		 * The base scale of the bone, used to offset any rescaling done to the bone's model due to exceeding the 3x3x3 model size limit.
		 */
		base_scale: number
		config?: IBlueprintBoneConfigJSON
	}
}

export type AnyRenderedNode = IRenderedNodes[keyof IRenderedNodes]

export interface IRenderedVariantModel {
	model: IRenderedModel | null
	custom_model_data: number
	resource_location: string
	item_model: string
}

export interface INodeStructure {
	uuid: string
	children: INodeStructure[]
}

export type IRenderedVariant = Omit<IBlueprintVariantJSON, 'uuid'> & {
	/**
	 * A map of bone UUID -> IRenderedVariantModel
	 */
	models: Record<string, IRenderedVariantModel>
}

export interface IRenderedRig {
	/**
	 * A map of outliner node UUIDs to rendered bones
	 */
	nodes: Record<string, AnyRenderedNode>
	/**
	 * A map of Variant UUID -> IRenderedVariant
	 */
	variants: Record<string, IRenderedVariant>
	/**
	 * A map of texture IDs to textures
	 */
	textures: Record<string, Texture>
	/**
	 * The export folder for the rig models
	 */
	model_export_folder: string
	/**
	 * The export folder for the rig textures
	 */
	texture_export_folder: string
	/**
	 * Whether or not this rig includes Cubes
	 */
	includes_custom_models: boolean
}

function renderCube(cube: Cube, rig: IRenderedRig, model: IRenderedModel) {
	if (!cube.export) return

	const element = {} as IRenderedElement

	element.from = cube.from.slice()
	element.to = cube.to.slice()

	if (cube.inflate) {
		element.from = element.from.map(v => v - cube.inflate)
		element.to = element.to.map(v => v + cube.inflate)
	}

	if (cube.shade === false) element.shade = false

	if (!(cube.rotation.allEqual(0) && cube.origin.allEqual(0))) {
		const axis = cube.rotationAxis() || 'y'
		element.rotation = {
			angle: cube.rotation[getAxisNumber(axis)],
			axis,
			origin: cube.origin,
		}
	}

	if (cube.rescale) {
		// @ts-ignore
		if (element.rotation) element.rotation.rescale = true
		else
			element.rotation = {
				angle: 0,
				axis: cube.rotation_axis || 'y',
				origin: cube.origin,
				rescale: true,
			}
	}

	if (cube.parent instanceof Group) {
		const parent = cube.parent
		element.from = element.from.map((v, i) => v - parent.origin[i])
		element.to = element.to.map((v, i) => v - parent.origin[i])
		if (element.rotation && !Array.isArray(element.rotation)) {
			element.rotation.origin = element.rotation.origin.map((v, i) => v - parent.origin[i])
		}
	}

	element.faces = {}
	for (const [face, data] of Object.entries(cube.faces)) {
		if (!data?.texture) continue
		const renderedFace = {} as IRenderedFace
		if (data.enabled) {
			renderedFace.uv = data.uv
				.slice()
				.map((v, i) => (v * 16) / UVEditor.getResolution(i % 2))
		}
		if (data.rotation) renderedFace.rotation = data.rotation
		if (data.texture) {
			const texture = data.getTexture()
			if (!texture) throw new Error('Texture not found')
			renderedFace.texture = '#' + texture.id
			rig.textures[texture.id] = texture
			const resourceLocation = getTextureResourceLocation(texture, rig).resourceLocation
			if (resourceLocation) model.textures[texture.id] = resourceLocation
		}
		if (data.cullface) renderedFace.cullface = data.cullface
		if (data.tint >= 0) renderedFace.tintindex = data.tint
		element.faces[face] = renderedFace
	}

	if (Object.keys(element.faces).length === 0) return
	model.elements ??= []
	model.elements.push(element)
}

const TEXTURE_RESOURCE_LOCATION_CACHE = new Map<string, IMinecraftResourceLocation>()
export function getTextureResourceLocation(texture: Texture, rig: IRenderedRig) {
	if (TEXTURE_RESOURCE_LOCATION_CACHE.has(texture.uuid)) {
		return TEXTURE_RESOURCE_LOCATION_CACHE.get(texture.uuid)!
	}
	if (!texture.name.endsWith('.png')) texture.name += '.png'
	if (texture.path && fs.existsSync(texture.path) && fs.statSync(texture.path).isFile()) {
		const parsed = parseResourcePackPath(texture.path)
		if (parsed) {
			TEXTURE_RESOURCE_LOCATION_CACHE.set(texture.uuid, parsed)
			return parsed
		}
	}
	const path = PathModule.join(rig.texture_export_folder, toSafeFuntionName(texture.name))
	const parsed = parseResourcePackPath(path)
	if (parsed) {
		TEXTURE_RESOURCE_LOCATION_CACHE.set(texture.uuid, parsed)
		return parsed
	}

	console.error(texture)
	throw new Error(`Invalid texture path: ${path}`)
}

function getBoneBoundingBox(group: Group) {
	const children = group.children.filter(e => e instanceof Cube) as Cube[]
	const box = new THREE.Box3()
	box.expandByPoint(new THREE.Vector3(group.origin[0], group.origin[1], group.origin[2]))
	for (const child of children) {
		box.expandByPoint(
			new THREE.Vector3(
				child.from[0] - child.inflate,
				child.from[1] - child.inflate,
				child.from[2] - child.inflate
			)
		)
		box.expandByPoint(
			new THREE.Vector3(
				child.to[0] + child.inflate,
				child.to[1] + child.inflate,
				child.to[2] + child.inflate
			)
		)
	}
	return box
}

function renderGroup(
	group: Group,
	rig: IRenderedRig,
	defaultVariant: IRenderedVariant
): INodeStructure | undefined {
	if (!group.export) return
	const parentId = group.parent instanceof Group ? group.parent.uuid : undefined

	const path = PathModule.join(rig.model_export_folder, group.name + `.json`)
	const parsed = parseResourcePackPath(path)

	if (!parsed) {
		console.error(group)
		throw new Error(`Invalid bone path: ${group.name} -> ${path}`)
	}

	const renderedBone: IRenderedNodes['Bone'] = {
		type: 'bone',
		name: group.name,
		safe_name: toSafeFuntionName(group.name),
		uuid: group.uuid,
		parent: parentId,
		bounding_box: getBoneBoundingBox(group),
		base_scale: 1,
		configs: group.configs,
		// This is a placeholder value that will be updated later once the animation renderer is run.
		default_transform: {} as INodeTransform,
	}
	let groupModel = defaultVariant.models[group.uuid]
	if (!groupModel) {
		groupModel = defaultVariant.models[group.uuid] = {
			model: {
				textures: {
					particle: 'minecraft:item/pufferfish',
				},
				display: { head: { rotation: [0, 180, 0] } },
			},
			custom_model_data: -1, // This is calculated when constructing the resource pack.
			resource_location: parsed.resourceLocation,
			item_model: parsed.resourceLocation,
		}
	}

	for (const node of group.children) {
		if (!node.export) continue
		switch (true) {
			case node instanceof Group: {
				renderGroup(node, rig, defaultVariant)
				break
			}
			case node instanceof Locator: {
				renderLocator(node, rig)
				break
			}
			case node instanceof TextDisplay: {
				renderTextDisplay(node, rig)
				break
			}
			case OutlinerElement.types.camera && node instanceof OutlinerElement.types.camera: {
				renderCamera(node as ICamera, rig)
				break
			}
			case node instanceof VanillaItemDisplay: {
				renderItemDisplay(node, rig)
				break
			}
			case node instanceof VanillaBlockDisplay: {
				renderBlockDisplay(node, rig)
				break
			}
			case node instanceof Cube: {
				renderCube(node, rig, groupModel.model!)
				rig.includes_custom_models = true
				break
			}
			default:
				console.warn(`Encountered unknown node type:`, node)
		}
	}

	// Export a struct instead of a bone if no elements are present
	if (!groupModel.model || !groupModel.model.elements || groupModel.model.elements.length === 0) {
		delete defaultVariant.models[group.uuid]
		const struct: IRenderedNodes['Struct'] = {
			type: 'struct',
			name: group.name,
			safe_name: renderedBone.safe_name,
			uuid: group.uuid,
			parent: parentId,
			default_transform: {} as INodeTransform,
		}
		rig.nodes[group.uuid] = struct
		return
	}

	const diff = new THREE.Vector3().subVectors(
		renderedBone.bounding_box.max,
		renderedBone.bounding_box.min
	)
	const max = Math.max(diff.x, diff.y, diff.z)
	const scale = Math.min(1, 24 / max)
	for (const element of groupModel.model.elements) {
		element.from = element.from.map(v => v * scale + 8)
		element.to = element.to.map(v => v * scale + 8)
		if (element.rotation && !Array.isArray(element.rotation)) {
			element.rotation.origin = element.rotation.origin.map(v => v * scale + 8)
		}
	}

	renderedBone.base_scale = 1 / scale
	rig.nodes[group.uuid] = renderedBone
}

function renderItemDisplay(display: VanillaItemDisplay, rig: IRenderedRig) {
	if (!display.export) return
	const parentId = display.parent instanceof Group ? display.parent.uuid : undefined

	const path = PathModule.join(rig.model_export_folder, display.name + `.json`)
	const parsed = parseResourcePackPath(path)

	if (!parsed) {
		console.error(display)
		throw new Error(`Invalid bone path: ${display.name} -> ${path}`)
	}

	const renderedBone: IRenderedNodes['ItemDisplay'] = {
		type: 'item_display',
		name: display.name,
		safe_name: toSafeFuntionName(display.name),
		uuid: display.uuid,
		parent: parentId,
		item: display.item,
		item_display: display.itemDisplay,
		base_scale: 1,
		config: display.config,
		default_transform: {} as INodeTransform,
	}

	rig.nodes[display.uuid] = renderedBone
}

function renderBlockDisplay(display: VanillaBlockDisplay, rig: IRenderedRig) {
	if (!display.export) return
	const parentId = display.parent instanceof Group ? display.parent.uuid : undefined

	const path = PathModule.join(rig.model_export_folder, display.name + `.json`)
	const parsed = parseResourcePackPath(path)

	if (!parsed) {
		console.error(display)
		throw new Error(`Invalid bone path: ${display.name} -> ${path}`)
	}

	const renderedBone: IRenderedNodes['BlockDisplay'] = {
		type: 'block_display',
		name: display.name,
		safe_name: toSafeFuntionName(display.name),
		uuid: display.uuid,
		block: display.block,
		parent: parentId,
		base_scale: 1,
		config: display.config,
		default_transform: {} as INodeTransform,
	}

	rig.nodes[display.uuid] = renderedBone
}

function renderTextDisplay(display: TextDisplay, rig: IRenderedRig): INodeStructure | undefined {
	if (!display.export) return
	const parentId = display.parent instanceof Group ? display.parent.uuid : undefined

	const path = PathModule.join(rig.model_export_folder, display.name + `.json`)
	const parsed = parseResourcePackPath(path)

	if (!parsed) {
		console.error(display)
		throw new Error(`Invalid bone path: ${display.name} -> ${path}`)
	}

	const renderedBone: IRenderedNodes['TextDisplay'] = {
		type: 'text_display',
		name: display.name,
		safe_name: toSafeFuntionName(display.name),
		uuid: display.uuid,
		parent: parentId,
		text: JsonText.fromString(display.text),
		line_width: display.lineWidth,
		background_color: display.backgroundColor,
		background_alpha: display.backgroundAlpha,
		align: display.align,
		shadow: display.shadow,
		see_through: display.seeThrough,
		base_scale: 1,
		config: display.config,
		default_transform: {} as INodeTransform,
	}

	rig.nodes[display.uuid] = renderedBone
	return {
		uuid: display.uuid,
		children: [],
	}
}

function renderLocator(locator: Locator, rig: IRenderedRig) {
	if (!locator.export) return
	const parentId = (locator.parent instanceof Group ? locator.parent.uuid : locator.parent)!

	const renderedLocator: IRenderedNodes['Locator'] = {
		type: 'locator',
		name: locator.name,
		safe_name: toSafeFuntionName(locator.name),
		uuid: locator.uuid,
		parent: parentId,
		config: locator.config,
		default_transform: {} as INodeTransform,
	}

	rig.nodes[locator.uuid] = renderedLocator
}

function renderCamera(camera: ICamera, rig: IRenderedRig) {
	if (!camera.export) return
	const parentId = (camera.parent instanceof Group ? camera.parent.uuid : camera.parent)!

	const renderedCamera: IRenderedNodes['Camera'] = {
		type: 'camera',
		name: camera.name,
		safe_name: toSafeFuntionName(camera.name),
		uuid: camera.uuid,
		parent: parentId,
		config: camera.config,
		default_transform: {} as INodeTransform,
	}

	rig.nodes[camera.uuid] = renderedCamera
}

function renderVariantModels(variant: Variant, rig: IRenderedRig) {
	const models: Record<string, IRenderedVariantModel> = {}

	const defaultVariant = Variant.getDefault()
	const defaultModels = rig.variants[defaultVariant.uuid].models

	for (const [uuid, bone] of Object.entries(rig.nodes)) {
		if (bone.type !== 'bone') continue
		if (variant.excludedNodes.find(v => v.value === uuid)) continue
		const textures: IRenderedModel['textures'] = {}

		let isOnlyTransparent = true
		const unreplacedTextures = new Set<string>(Object.keys(defaultModels[uuid].model!.textures))

		for (const [fromUUID, toUUID] of variant.textureMap.map.entries()) {
			const fromTexture = Texture.all.find(t => t.uuid === fromUUID)
			if (!fromTexture) throw new Error(`From texture not found: ${fromUUID}`)
			const toTexture = Texture.all.find(t => t.uuid === toUUID)
			if (!toTexture) throw new Error(`To texture not found: ${toUUID}`)
			textures[fromTexture.id] = getTextureResourceLocation(toTexture, rig).resourceLocation
			rig.textures[toTexture.id] = toTexture
			isOnlyTransparent = false
		}

		// Don't export models without any texture changes
		if (Object.keys(textures).length === 0) continue

		// Use empty model if all textures are transparent
		if (isOnlyTransparent && unreplacedTextures.size === 0) {
			models[uuid] = {
				model: null,
				custom_model_data: 1,
				resource_location: 'animated_java:empty',
				item_model: 'animated_java:empty',
			}
			continue
		}

		const modelParent = PathModule.join(rig.model_export_folder, bone.safe_name + '.json')
		const parsed = parseResourcePackPath(modelParent)
		if (!parsed) {
			throw new Error(`Invalid Bone Name: '${bone.safe_name}' -> '${modelParent}'`)
		}

		const modelPath = variant.isDefault
			? PathModule.join(rig.model_export_folder, bone.safe_name + '.json')
			: PathModule.join(rig.model_export_folder, variant.name, bone.safe_name + '.json')
		const parsedModelPath = parseResourcePackPath(modelPath)
		if (!parsedModelPath) {
			throw new Error(`Invalid Variant Name: '${variant.name}' -> '${modelPath}'`)
		}

		models[uuid] = {
			model: {
				parent: parsed.resourceLocation,
				textures,
			},
			custom_model_data: -1, // This is calculated when constructing the resource pack.
			resource_location: parsedModelPath.resourceLocation,
			item_model: parsedModelPath.resourceLocation,
		}
	}

	return models
}

export function hashRig(rig: IRenderedRig) {
	const hash = crypto.createHash('sha256')
	for (const [nodeUuid, node] of Object.entries(rig.nodes)) {
		hash.update('node;')
		hash.update(nodeUuid)
		hash.update(node.name)
		hash.update(node.default_transform.matrix.elements.toString())
		switch (node.type) {
			case 'bone': {
				const model = rig.variants[Variant.getDefault().uuid].models[nodeUuid]
				hash.update(';' + JSON.stringify(model) || '')
				if (!node.configs) break // Skip if there are no configs
				if (node.configs.default) {
					const defaultConfig = BoneConfig.fromJSON(node.configs.default)
					if (!defaultConfig.isDefault()) {
						hash.update('defaultconfig;')
						hash.update(defaultConfig.toNBT().toString())
					}
				}
				for (const [variantName, config] of Object.entries(node.configs.variants)) {
					const variantConfig = BoneConfig.fromJSON(config)
					if (!variantConfig.isDefault()) {
						hash.update('variantconfig;')
						hash.update(variantName)
						hash.update(variantConfig.toNBT().toString())
					}
				}
				break
			}
			case 'locator': {
				if (node.config) {
					hash.update(';' + JSON.stringify(node.config))
				}
				break
			}
			case 'camera': {
				if (node.config) {
					hash.update(';' + JSON.stringify(node.config))
				}
				break
			}
			case 'text_display': {
				hash.update(`;${node.text?.toString() as string}`)
				if (node.config) {
					hash.update(';' + JSON.stringify(node.config))
				}
				break
			}
		}
	}
	return hash.digest('hex')
}

function renderVariant(variant: Variant, rig: IRenderedRig): IRenderedVariant {
	return {
		...variant.toJSON(),
		models: renderVariantModels(variant, rig),
	}
}

function getDefaultTransforms(rig: IRenderedRig) {
	const anim = new Blockbench.Animation()
	correctSceneAngle()
	updatePreview(anim, 0)
	const transforms = getFrame(anim, rig.nodes).node_transforms
	restoreSceneAngle()
	return transforms
}

export function renderRig(modelExportFolder: string, textureExportFolder: string): IRenderedRig {
	console.time('Rendering rig took')
	Texture.all.forEach((t, i) => (t.id = String(i)))

	Animator.showDefaultPose()

	const rig: IRenderedRig = {
		nodes: {},
		variants: {},
		textures: {},
		model_export_folder: modelExportFolder,
		texture_export_folder: textureExportFolder,
		includes_custom_models: false,
	}

	const defaultVariant = Variant.getDefault()
	rig.variants[defaultVariant.uuid] = {
		...defaultVariant.toJSON(),
		models: {},
	}

	for (const node of Outliner.root) {
		switch (true) {
			case node instanceof Group: {
				renderGroup(node, rig, rig.variants[defaultVariant.uuid])
				break
			}
			case node instanceof Locator: {
				renderLocator(node, rig)

				break
			}
			case node instanceof TextDisplay: {
				renderTextDisplay(node, rig)
				break
			}
			case OutlinerElement.types.camera && node instanceof OutlinerElement.types.camera: {
				renderCamera(node as ICamera, rig)
				break
			}
			case node instanceof VanillaItemDisplay: {
				renderItemDisplay(node, rig)
				break
			}
			case node instanceof VanillaBlockDisplay: {
				renderBlockDisplay(node, rig)
				break
			}
			case node instanceof Cube: {
				throw new IntentionalExportError(
					`Cubes cannot be exported as root nodes. Please parent them to a bone. (Found '${node.name}' outside of a bone)`
				)
			}
			default:
				console.warn(`Encountered unknown node type:`, node)
		}
	}

	const defaultTransforms = getDefaultTransforms(rig)
	for (const [uuid, node] of Object.entries(rig.nodes)) {
		node.default_transform = defaultTransforms[uuid]
	}

	for (const variant of Variant.all) {
		if (variant.isDefault) continue
		rig.variants[variant.uuid] = renderVariant(variant, rig)
	}

	TEXTURE_RESOURCE_LOCATION_CACHE.clear()

	console.timeEnd('Rendering rig took')
	console.log('Rendered rig:', rig)
	return rig
}
