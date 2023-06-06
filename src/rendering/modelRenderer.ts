import { parseResourcePackPath, safeFunctionName } from '../minecraft/util'
import { ProgressBarController } from '../util/progress'
import { Variant } from '../variants'
import {
	correctSceneAngle,
	getAnimationNodes,
	IAnimationNode,
	restoreSceneAngle,
	updatePreview,
} from './animationRenderer'

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
		head: { rotation: [0, number, 0] }
	}
}

export interface IRenderedNode {
	type: string
	parent: string
	parentNode: Group | null
	name: string
	node: OutlinerNode
}

export interface ICamera extends OutlinerElement {
	name: string
	path: string
	position: ArrayVector3
	rotation: ArrayVector3
	linked_preview: string
	camera_linked: boolean
	visibility: boolean
	entity_type: string
	nbt: string
}

export interface IRenderedNodes {
	Bone: IRenderedNode & {
		type: 'bone'
		node: Group
		textures: Record<string, Texture>
		model: IRenderedModel
		customModelData: number
		modelPath: string
		resourceLocation: string
		boundingBox: THREE.Box3
		scale: number
		nbt: string
	}
	Camera: IRenderedNode & {
		type: 'camera'
		name: string
		node: ICamera
		entity_type: string
		nbt: string
	}
	Locator: IRenderedNode & {
		type: 'locator'
		node: Locator
		entity_type: string
		nbt: string
	}
}

export type AnyRenderedNode = IRenderedNodes[keyof IRenderedNodes]

export interface IRenderedBoneVariant {
	model: IRenderedModel
	customModelData: number
	modelPath: string
	resourceLocation: string
}

export interface INodeStructure {
	uuid: string
	children: INodeStructure[]
}

export interface IRenderedRig {
	/**
	 * A map of bone UUIDs to rendered models
	 */
	models: Record<string, IRenderedModel>
	/**
	 * A map of variant names to maps of rendered models
	 */
	variantModels: Record<string, Record<string, IRenderedBoneVariant>>
	/**
	 * A map of outliner node UUIDs to rendered bones
	 */
	nodeMap: Record<string, AnyRenderedNode>
	/**
	 * The recursive structure of node UUIDs
	 */
	nodeStructure: INodeStructure
	/**
	 * A map of texture UUIDs to textures
	 */
	textures: Record<string, Texture>
	/**
	 * The default pose of the rig as an Animation frame
	 */
	defaultPose: IAnimationNode[]
	/**
	 * The export folder for the rig models
	 */
	modelExportFolder: string
	/**
	 * The export folder for the rig textures
	 */
	textureExportFolder: string
}

export class CustomModelData {
	private static current = 0
	public static usedIds: number[] = []

	public static get() {
		let id = this.current
		while (this.usedIds.includes(id)) id++
		this.current = id + 1
		this.usedIds.push(id)
		return id
	}

	public static set(value: number) {
		this.current = value
	}
}

let progress: ProgressBarController

function countNodesRecursive(nodes: OutlinerNode[] = Outliner.root): number {
	let count = 0
	for (const node of nodes) {
		if (node instanceof Group) {
			count += countNodesRecursive(node.children)
		} else count++
	}
	return count
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
		if (!data) continue
		if (!data.texture) continue
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
	progress.add(1)
	progress.update()
	return element
}

export function getTextureResourceLocation(texture: Texture, rig: IRenderedRig) {
	if (texture.path && fs.existsSync(texture.path)) {
		const parsed = parseResourcePackPath(texture.path)
		if (parsed) return parsed
	}
	const path = PathModule.join(rig.textureExportFolder, safeFunctionName(texture.name) + '.png')

	const parsed = parseResourcePackPath(path)
	if (parsed) return parsed

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

function renderGroup(group: Group, rig: IRenderedRig) {
	if (!group.export) return
	const parentId = (group.parent instanceof Group ? group.parent.uuid : group.parent)!

	const path = PathModule.join(rig.modelExportFolder, group.name + `.json`)
	const parsed = parseResourcePackPath(path)

	if (!parsed) {
		console.error(group)
		throw new Error(`Invalid bone path: ${group.name} -> ${path}`)
	}

	let displayRotation = 0
	if (Project!.animated_java_settings!.target_minecraft_version.selected!.value === '1.20+')
		displayRotation = 180

	const renderedBone: IRenderedNodes['Bone'] & {
		model: { elements: IRenderedElement[] }
	} = {
		type: 'bone',
		parent: parentId,
		parentNode: group.parent instanceof Group ? group.parent : null,
		node: group,
		name: group.name,
		textures: {},
		model: {
			textures: {},
			elements: [],
			display: {
				head: { rotation: [0, displayRotation, 0] },
			},
		},
		modelPath: path,
		customModelData: -1,
		resourceLocation: parsed.resourceLocation,
		boundingBox: getBoneBoundingBox(group),
		scale: 1,
		nbt: group.nbt || '{}',
	}

	const structure: INodeStructure = {
		uuid: group.uuid,
		children: [],
	}

	for (const node of group.children) {
		if (!node.export) continue
		if (node instanceof Group) {
			const bone = renderGroup(node, rig)
			if (bone) structure.children.push(bone)
		} else if (node instanceof Locator) {
			const locator = renderLocator(node, rig)
			if (locator) structure.children.push(locator)
		} else if (OutlinerElement.types.camera && node instanceof OutlinerElement.types.camera) {
			const camera = renderCamera(node as ICamera, rig)
			if (camera) structure.children.push(camera)
		} else if (node instanceof Cube) {
			const element = renderCube(node, rig, renderedBone.model)
			if (element) renderedBone.model.elements.push(element)
		} else {
			console.warn(`Encountered unknown node type:`, node)
		}
		progress.add(1)
	}

	// Don't export groups without a model.
	if (group.children.filter(c => c instanceof Cube).length === 0) return

	const diff = new THREE.Vector3().subVectors(
		renderedBone.boundingBox.max,
		renderedBone.boundingBox.min
	)
	const max = Math.max(diff.x, diff.y, diff.z)
	const scale = Math.min(1, 24 / max)
	for (const element of renderedBone.model.elements) {
		element.from = element.from.map(v => v * scale + 8)
		element.to = element.to.map(v => v * scale + 8)
		if (element.rotation && !Array.isArray(element.rotation)) {
			element.rotation.origin = element.rotation.origin.map(v => v * scale + 8)
		}
	}
	renderedBone.scale = 1 / scale

	rig.models[group.uuid] = renderedBone.model
	rig.nodeMap[group.uuid] = renderedBone
	progress.add(1)
	return structure
}

function renderLocator(locator: Locator, rig: IRenderedRig): INodeStructure {
	const parentId = (locator.parent instanceof Group ? locator.parent.uuid : locator.parent)!

	const renderedLocator: IRenderedNodes['Locator'] = {
		type: 'locator',
		parent: parentId,
		parentNode: locator.parent instanceof Group ? locator.parent : null,
		node: locator,
		name: locator.name,
		entity_type: locator.entity_type,
		nbt: locator.nbt,
	}

	rig.nodeMap[locator.uuid] = renderedLocator
	progress.add(1)
	return {
		uuid: locator.uuid,
		children: [],
	}
}

function renderCamera(camera: ICamera, rig: IRenderedRig): INodeStructure {
	const parentId = (camera.parent instanceof Group ? camera.parent.uuid : camera.parent)!

	const renderedCamera: IRenderedNodes['Camera'] = {
		type: 'camera',
		parent: parentId,
		parentNode: camera.parent instanceof Group ? camera.parent : null,
		node: camera,
		name: camera.name,
		entity_type: camera.entity_type,
		nbt: camera.nbt,
	}

	rig.nodeMap[camera.uuid] = renderedCamera
	progress.add(1)
	return {
		uuid: camera.uuid,
		children: [],
	}
}

function renderVariantModels(variant: Variant, rig: IRenderedRig) {
	const bones: Record<string, IRenderedBoneVariant> = {}

	for (const [uuid, bone] of Object.entries(rig.nodeMap)) {
		if (bone.type !== 'bone') continue
		const textures: IRenderedModel['textures'] = {}
		for (const { fromTexture, toTexture } of variant.textureMapIterator()) {
			if (!(fromTexture && toTexture))
				throw new Error(
					`Invalid texture mapping found while exporting variant models. If you're seeing this error something has gone horribly wrong.`
				)
			if (!rig.textures[toTexture.id]) rig.textures[toTexture.id] = toTexture
			textures[fromTexture.id] = getTextureResourceLocation(toTexture, rig).resourceLocation
		}

		const parsed = PathModule.parse(bone.modelPath)
		const modelPath = PathModule.join(parsed.dir, variant.name, `${bone.name}.json`)
		const parsedModelPath = parseResourcePackPath(modelPath)
		if (!parsedModelPath) throw new Error(`Invalid variant model path: ${modelPath}`)

		bones[uuid] = {
			model: {
				parent: bone.resourceLocation,
				textures,
			},
			customModelData: -1,
			modelPath,
			resourceLocation: parsedModelPath.resourceLocation,
		}
	}

	return bones
}

function getDefaultPose(rig: IRenderedRig) {
	const anim = new Blockbench.Animation()
	correctSceneAngle()
	updatePreview(anim, 0)
	rig.defaultPose = getAnimationNodes(anim, rig.nodeMap)
	restoreSceneAngle()
}

export function renderRig(modelExportFolder: string, textureExportFolder: string): IRenderedRig {
	CustomModelData.set(1)
	Texture.all.forEach((t, i) => (t.id = String(i)))

	Animator.showDefaultPose()

	const rootNode: INodeStructure = {
		uuid: 'root',
		children: [],
	}

	const rig: IRenderedRig = {
		models: {},
		variantModels: {},
		nodeMap: {},
		nodeStructure: rootNode,
		textures: {},
		defaultPose: [],
		modelExportFolder,
		textureExportFolder,
	}

	progress = new ProgressBarController('Rendering Rig...', countNodesRecursive())

	// FIXME - Add a warning if no bones or models are exported
	for (const node of Outliner.root) {
		if (node instanceof Group) {
			const bone = renderGroup(node, rig)
			if (bone) rootNode.children.push(bone)
		} else if (node instanceof Locator) {
			const locator = renderLocator(node, rig)
			if (locator) rootNode.children.push(locator)
		} else if (OutlinerElement.types.camera && node instanceof OutlinerElement.types.camera) {
			const camera = renderCamera(node as ICamera, rig)
			if (camera) rootNode.children.push(camera)
		} else if (node instanceof Cube) {
			console.error(`Encountered cube in root of outliner:`, node)
		} else {
			console.warn(`Encountered unknown node type:`, node)
		}
		progress.add(1)
		progress.update()
	}

	getDefaultPose(rig)

	for (const variant of Project!.animated_java_variants!.variants) {
		if (variant.default) continue // Don't export the default variant, it's redundant data.
		rig.variantModels[variant.name] = renderVariantModels(variant, rig)
	}

	progress.finish()
	return rig
}
