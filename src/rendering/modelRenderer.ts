import { parseResourcePackPath } from '../minecraft/util'
import { ProgressBarController } from '../util/progress'
import { Variant } from '../variants'
import { getAnimationBones, IAnimationBone } from './animationRenderer'

interface IRenderedFace {
	uv: number[]
	rotation?: number
	texture: string
	cullface?: string
	tintindex?: number
}

interface IRenderedElement {
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
interface IRenderedModel {
	parent?: string
	textures: Record<string, string>
	elements?: IRenderedElement[]
}

interface IRenderedBone {
	parent: string
	name: string
	textures: Record<string, Texture>
	model: IRenderedModel
	customModelData: number
	modelPath: string
	resourceLocation: string
	boundingBox: THREE.Box3
	scale: number
}

interface IRenderedBoneVariant {
	model: IRenderedModel
	customModelData: number
	modelPath: string
	resourceLocation: string
}

interface IBoneStructure {
	uuid: string
	children: IBoneStructure[]
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
	 * A map of bone UUIDs to rendered bones
	 */
	boneMap: Record<string, IRenderedBone>
	/**
	 * A recursive structure of bone UUIDs
	 */
	boneStructure: IBoneStructure
	/**
	 * A map of texture UUIDs to textures
	 */
	textures: Record<string, Texture>
	/**
	 * The default pose of the rig as an Animation frame
	 */
	defaultPose: IAnimationBone[]
	/**
	 * The output folder for the rig
	 */
	outputFolder: string
}

let customModelData = 1
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

	if (!(cube.rotation.allEqual(0) || cube.origin.allEqual(0))) {
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
			if (texture?.path) {
				renderedFace.texture = '#' + texture.id
				rig.textures[texture.id] = texture
				const parsed = parseResourcePackPath(texture.path)
				if (parsed) model.textures[texture.id] = parsed.resourceLocation
			} else renderedFace.texture = '#missing'
		}
		if (data.cullface) renderedFace.cullface = data.cullface
		if (data.tint >= 0) renderedFace.tintindex = data.tint
		element.faces[face] = renderedFace
	}

	if (Object.keys(element.faces).length === 0) return
	progress.add(1)
	return element
}

function renderTexture(texture: Texture) {
	if (!texture.path) {
		console.error(texture)
		throw new Error(`Texture ${texture.name} has no path`)
	}
	const parsed = parseResourcePackPath(texture.path)
	if (parsed) return parsed.resourceLocation

	console.error(texture)
	throw new Error(`Invalid texture path: ${texture.path}`)
}

function getBoneBoundingBox(group: Group) {
	const children = group.children.filter(e => e instanceof Cube) as Cube[]
	const box = new THREE.Box3()
	box.expandByPoint(new THREE.Vector3(group.origin[0], group.origin[1], group.origin[2]))
	for (const child of children) {
		box.expandByPoint(new THREE.Vector3(child.from[0], child.from[1], child.from[2]))
		box.expandByPoint(new THREE.Vector3(child.to[0], child.to[1], child.to[2]))
	}
	return box
}

function renderGroup(group: Group, rig: IRenderedRig) {
	if (!group.export) return
	const parentId = group.parent instanceof Group ? group.parent.uuid : group.parent

	const path = PathModule.join(rig.outputFolder, group.name + `.json`)
	const parsed = parseResourcePackPath(path)

	if (!parsed) {
		console.error(group)
		throw new Error(`Invalid bone path: ${group.name} -> ${path}`)
	}

	const renderedBone: IRenderedBone & { model: { elements: IRenderedElement[] } } = {
		parent: parentId,
		name: group.name,
		textures: {},
		model: {
			textures: {},
			elements: [],
		},
		modelPath: path,
		customModelData: customModelData++,
		resourceLocation: parsed.resourceLocation,
		boundingBox: getBoneBoundingBox(group),
		scale: 1,
	}

	const structure: IBoneStructure = {
		uuid: group.uuid,
		children: [],
	}

	for (const node of group.children) {
		if (node instanceof Group) {
			const bone = renderGroup(node, rig)
			if (bone) structure.children.push(bone)
		} else if (node instanceof Cube) {
			const element = renderCube(node, rig, renderedBone.model)
			if (element) renderedBone.model.elements.push(element)
		} else {
			console.warn(`Encountered unknown node type:`, node)
		}
		progress.add(1)
	}

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
	rig.boneMap[group.uuid] = renderedBone
	progress.add(1)
	return structure
}

function renderVariantModels(variant: Variant, rig: IRenderedRig) {
	const bones: Record<string, IRenderedBoneVariant> = {}

	for (const [uuid, bone] of Object.entries(rig.boneMap)) {
		const textures: IRenderedModel['textures'] = {}
		for (const { fromTexture, toTexture } of variant.textureMapIterator()) {
			if (!(fromTexture && toTexture))
				throw new Error(
					`Invalid texture mapping found while exporting variant models. If you're seeing this error something has gone horribly wrong.`
				)
			textures[fromTexture.id] = renderTexture(toTexture)
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
			customModelData: customModelData++,
			modelPath,
			resourceLocation: parsedModelPath.resourceLocation,
		}
	}

	return bones
}

export function renderRig(outputFolder: string): IRenderedRig {
	customModelData = 1
	Texture.all.forEach((t, i) => (t.id = String(i)))

	Animator.showDefaultPose()

	const rig: IRenderedRig = {
		models: {},
		variantModels: {},
		boneMap: {},
		boneStructure: {} as IBoneStructure,
		textures: {},
		defaultPose: [],
		outputFolder,
	}

	progress = new ProgressBarController('Rendering Rig...', countNodesRecursive())

	for (const node of Outliner.root) {
		if (node instanceof Group) {
			const bone = renderGroup(node, rig)
			if (bone) rig.boneStructure = bone
		} else if (node instanceof Cube) {
			// FIXME - The user should be warned of this sooner
			console.error(`Encountered cube outside of bone:`, node)
		} else {
			console.warn(`Encountered unknown node type:`, node)
		}
		progress.add(1)
	}

	rig.defaultPose = getAnimationBones(rig.boneMap)

	for (const variant of Project!.animated_java_variants!.variants) {
		if (variant.default) continue // Don't export the default variant, it's redundant data.
		rig.variantModels[variant.name] = renderVariantModels(variant, rig)
	}

	progress.finish()
	return rig
}
