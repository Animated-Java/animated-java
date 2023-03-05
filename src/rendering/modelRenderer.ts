import * as pathjs from 'path'
import { parseResourcePackPath } from '../minecraft/util'
import { Variant } from '../variants'

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
	rotation?: oneLiner | number[]
	faces?: Record<string, IRenderedFace>
}

/**
 * An actual Minecraft model
 */
interface IRenderedModel {
	parent?: string
	textureOverrides: Record<string, string>
	elements?: IRenderedElement[]
}

interface IRenderedBone {
	parent: string
	name: string
	textures: Record<string, Texture>
	model: IRenderedModel
	modelPath: string
	resourceLocation: string
}

interface IBoneStructure {
	uuid: string
	children: IBoneStructure[]
}

interface IRenderedRig {
	/**
	 * A map of bone UUIDs to rendered models
	 */
	models: Record<string, IRenderedModel>
	/**
	 * A map of variant names to maps of rendered models
	 */
	variants: Record<string, Record<string, IRenderedModel>>
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
	 * The output folder for the rig
	 */
	outputFolder: string
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
		element.rotation = new oneLiner({
			angle: cube.rotation[getAxisNumber(axis)],
			axis,
			origin: cube.origin,
		})
	}

	if (cube.rescale) {
		// @ts-ignore
		if (element.rotation) element.rotation.rescale = true
		else
			element.rotation = new oneLiner({
				angle: 0,
				axis: cube.rotation_axis || 'y',
				origin: cube.origin,
				rescale: true,
			})
	}

	element.faces = {}
	for (const [face, data] of Object.entries(cube.faces)) {
		if (!data) continue
		if (!data.texture) continue
		const renderedFace = new oneLiner({}) as IRenderedFace
		if (data.enabled) {
			renderedFace.uv = cube.faces[face].uv
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
				if (parsed) model.textureOverrides[texture.id] = parsed.resourceLocation
			} else renderedFace.texture = '#missing'
		}
		if (data.cullface) renderedFace.cullface = data.cullface
		if (data.tint) renderedFace.tintindex = data.tint
		element.faces[face] = renderedFace
	}

	if (Object.keys(element.faces).length === 0) return
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

function renderGroup(group: Group, rig: IRenderedRig) {
	if (!group.export) return
	const parentId = group.parent instanceof Group ? group.parent.uuid : group.parent

	let path: string, parsed: { resourceLocation: string } & any
	if (parentId === 'root') {
		path = pathjs.join(rig.outputFolder)
		parsed = parseResourcePackPath(path)
	} else {
		path = pathjs.join(rig.outputFolder, group.name + `.json`)
		parsed = parseResourcePackPath(path)
	}

	if (!parsed) {
		console.error(group)
		throw new Error(`Invalid bone path: ${group.name} -> ${path}`)
	}

	const renderedBone: IRenderedBone & { model: { elements: IRenderedElement[] } } = {
		parent: parentId,
		name: group.name,
		textures: {},
		model: {
			textureOverrides: {},
			elements: [],
		},
		modelPath: path,
		resourceLocation: parsed.resourceLocation,
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
	}

	rig.models[group.uuid] = renderedBone.model
	rig.boneMap[group.uuid] = renderedBone
	return structure
}
// if (!(Project?.animated_java_settings)) return
// // FIXME - This needs to verify that the output path is a valid location before starting the rendering process.
// const outputFolder = Project.animated_java_settings.rig_export_folder.value

function renderVariantModels(variant: Variant, rig: IRenderedRig) {
	const models: Record<string, IRenderedModel> = {}

	for (const [uuid, bone] of Object.entries(rig.boneMap)) {
		const textureOverrides: IRenderedModel['textureOverrides'] = {}
		for (const { fromTexture, toTexture } of variant.textureMapIterator()) {
			if (!(fromTexture && toTexture))
				throw new Error(
					`Invalid texture mapping found while exporting variant models. If you're seeing this error something has gone horribly wrong.`
				)
			textureOverrides[fromTexture.id] = renderTexture(toTexture)
		}

		models[uuid] = { parent: bone.resourceLocation, textureOverrides }
	}

	return models
}

export function renderRig(): IRenderedRig {
	if (!Project?.animated_java_settings)
		throw new Error(
			`No project settings found. If you see this error something has gone horribly wrong.`
		)

	if (!Project.animated_java_variants) {
		throw new Error(
			`No variants found. If you see this error something has gone horribly wrong.`
		)
	}

	const rig: IRenderedRig = {
		models: {},
		variants: {},
		boneMap: {},
		boneStructure: {} as IBoneStructure,
		textures: {},
		outputFolder: Project.animated_java_settings.rig_export_folder.value,
	}

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
	}

	for (const variant of Project.animated_java_variants.variants) {
		rig.variants[variant.name] = renderVariantModels(variant, rig)
	}

	return rig
}
