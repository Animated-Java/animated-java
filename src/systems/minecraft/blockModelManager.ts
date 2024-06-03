import { getPathFromResourceLocation, parseResourceLocation } from '../../util/minecraftUtil'
import { assetsLoaded, getJSONAsset, getPngAssetAsDataUrl } from './assetManager'
import { IBlockModel } from './model'
import { TEXTURE_FRAG_SHADER, TEXTURE_VERT_SHADER } from './textureShaders'
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils'

type BlockModelMesh = { mesh: THREE.Mesh; outline: THREE.LineSegments }

const LOADER = new THREE.TextureLoader()
const BLOCK_MODEL_CACHE = new Map<string, BlockModelMesh>()

function getBlockResourceLocation(item: string) {
	const resource = parseResourceLocation(item)
	return resource.namespace + ':' + 'block/' + resource.path
}

export async function getBlockModel(item: string): Promise<BlockModelMesh | undefined> {
	await assetsLoaded()
	let result = BLOCK_MODEL_CACHE.get(item)
	if (!result) {
		console.warn(`Found no cached item model mesh for '${item}'`)
		result = await parseBlockModel(getBlockResourceLocation(item))
		BLOCK_MODEL_CACHE.set(item, result)
	}
	if (!result) return undefined
	result = {
		mesh: result.mesh.clone(true),
		outline: result.outline.clone(true),
	}
	for (const child of result.mesh.children as THREE.Mesh[]) {
		child.geometry = child.geometry.clone()
	}
	result.mesh.geometry = result.mesh.geometry.clone()
	result.mesh.name = item
	result.mesh.isVanillaBlockModel = true
	console.log(`Loaded block model for '${item}'`, result)
	return result
}

async function parseBlockModel(
	location: string,
	childModel?: IBlockModel
): Promise<BlockModelMesh> {
	const modelPath = getPathFromResourceLocation(location, 'models')
	const model = getJSONAsset(modelPath + '.json') as IBlockModel

	if (childModel) {
		if (childModel.textures !== undefined) {
			model.textures ??= {}
			Object.assign(model.textures, childModel.textures)
		}
		// Interesting that elements aren't merged in vanilla...
		if (childModel.elements !== undefined) model.elements = childModel.elements
		if (childModel.display !== undefined)
			model.display = Object.assign(model.display || {}, childModel.display)
		if (childModel.ambientocclusion !== undefined)
			model.ambientocclusion = childModel.ambientocclusion
	}

	if (model.parent) {
		return await parseBlockModel(model.parent, model)
	}

	return await generateBlockMesh(location, model)

	throw new Error(`Unsupported block model '${location}'`)
}

async function generateBlockMesh(location: string, model: IBlockModel): Promise<BlockModelMesh> {
	console.log(`Generating block mesh for '${location}' from `, model)
	const mesh: THREE.Mesh = new THREE.Mesh()

	if (!model.elements) {
		throw new Error(`No elements defined in block model '${location}'`)
	}
	if (!model.textures) {
		throw new Error(`No textures defined in block model '${location}'`)
	}

	const outlineGeos: THREE.BufferGeometry[] = []

	for (const element of model.elements) {
		const size: ArrayVector3 = [
			element.to[0] - element.from[0],
			element.to[1] - element.from[1],
			element.to[2] - element.from[2],
		]
		const position: ArrayVector3 = [
			element.from[0] + (element.to[0] - element.from[0]) / 2,
			element.from[1] + (element.to[1] - element.from[1]) / 2,
			element.from[2] + (element.to[2] - element.from[2]) / 2,
		]
		if (size[0] === 0) {
			size[0] += 0.01
			position[0] -= 0.005
		}
		if (size[1] === 0) {
			size[1] += 0.01
			position[1] -= 0.005
		}
		if (size[2] === 0) {
			size[2] += 0.01
			position[2] -= 0.005
		}

		const geometry = new THREE.BoxGeometry(...size)
		geometry.translate(...position)

		if (element.rotation) {
			let factor: number | undefined
			if (element.rotation.rescale) {
				factor = getRescalingFactor(element.rotation.angle)
			}

			console.log(element.rotation)
			let origin = element.rotation.origin
			if (origin) {
				console.log('Origin:', origin)
				origin = [origin[0], origin[1], origin[2]]
				geometry.translate(...(origin.map(v => -v) as ArrayVector3))
			}

			switch (element.rotation.axis) {
				case 'x':
					geometry.rotateX(Math.degToRad(element.rotation.angle))
					if (factor !== undefined) geometry.scale(1, factor, factor)
					break
				case 'y':
					geometry.rotateY(Math.degToRad(element.rotation.angle))
					if (factor !== undefined) geometry.scale(factor, 1, factor)
					break
				case 'z':
					geometry.rotateZ(Math.degToRad(element.rotation.angle))
					if (factor !== undefined) geometry.scale(factor, factor, 1)
					break
			}

			if (origin) {
				geometry.translate(...origin)
			}
		}

		geometry.translate(-8, -8, -8)

		const indices = []
		for (let i = 0; i < 6; i++) {
			indices.push(0 + i * 4, 2 + i * 4, 1 + i * 4, 2 + i * 4, 3 + i * 4, 1 + i * 4)
			geometry.addGroup(i * 6, 6, i)
		}
		geometry.setIndex(indices)
		geometry.setAttribute(
			'highlight',
			new THREE.BufferAttribute(new Uint8Array(geometry.attributes.position.count), 1)
		)

		if (!element.faces) {
			throw new Error(`No faces defined in element for block model '${location}'`)
		}

		const uvs: number[] = []
		const materials: THREE.Material[] = []
		for (const faceKey of Canvas.face_order) {
			const face = element.faces[faceKey]
			if (!face) {
				materials.push(Canvas.transparentMaterial)
				uvs.push(0, 0, 0, 0, 0, 0, 0, 0)
				continue
			}
			const texture = (await loadTexture(model.textures, face.texture)).clone()
			const material = new THREE.ShaderMaterial({
				uniforms: {
					map: new THREE.Uniform(texture),
					// @ts-expect-error
					SHADE: { type: 'bool', value: settings.shading.value },
					LIGHTCOLOR: {
						// @ts-expect-error
						type: 'vec3',
						value: new THREE.Color()
							.copy(Canvas.global_light_color)
							.multiplyScalar(settings.brightness.value / 50),
					},
					// @ts-expect-error
					LIGHTSIDE: { type: 'int', value: Canvas.global_light_side },
					// @ts-expect-error
					EMISSIVE: { type: 'bool', value: false },
				},
				vertexShader: TEXTURE_VERT_SHADER,
				fragmentShader: TEXTURE_FRAG_SHADER,
				blending: THREE.NormalBlending,
				side: Canvas.getRenderSide(),
				transparent: true,
			})
			// @ts-expect-error
			material.map = texture
			material.name = location
			materials.push(material)

			const tw = texture.image.width
			const th = texture.image.height
			if (face.uv) {
				const [x, y, w, h] = face.uv
				// The THREE face UV has a strange order.
				// upper-left, upper-right, lower-left, lower-right
				// The MC input UV is only upper-left, and lower-right coords.
				// prettier-ignore
				const uv = [
					[x / tw, y / th],
					[w / tw, y / th],
					[x / tw, h / th],
					[w / tw, h / th],
				]
				if (face.rotation) {
					let rot = face.rotation + 0
					while (rot > 0) {
						const a = uv[0]
						uv[0] = uv[2]
						uv[2] = uv[3]
						uv[3] = uv[1]
						uv[1] = a
						rot -= 90
					}
				}
				texture.flipY = false

				uvs.push(...uv.flat())
			} else {
				// Create uvs based on the element's position and size
				const [x, y, z] = element.from
				const [w, h, d] = size
				switch (faceKey) {
					// Up and down faces are flipped on both axes
					case 'down':
						// prettier-ignore
						uvs.push(
							x / tw, z / th,
							(x + w) / tw, z / th,
							x / tw, (z + d) / th,
							(x + w) / tw, (z + d) / th,
						)
						break
					case 'up':
						// prettier-ignore
						uvs.push(
							x / tw, z / th,
							(x + w) / tw, z / th,
							x / tw, (z + d) / th,
							(x + w) / tw, (z + d) / th,
						)
						break
					case 'north':
						// prettier-ignore
						uvs.push(
							(x + w) / tw, (y + h) / th,
							x / tw, (y + h) / th,
							(x + w) / tw, y / th,
							x / tw, y / th,
						)
						break
					case 'south':
						// prettier-ignore
						uvs.push(
							(x + w) / tw, (y + h) / th,
							x / tw, (y + h) / th,
							(x + w) / tw, y / th,
							x / tw, y / th,
						)
						break
					case 'west':
						// prettier-ignore
						uvs.push(
							(z + d) / tw, (y + h) / th,
							z / tw, (y + h) / th,
							(z + d) / tw, y / th,
							z / tw, y / th,
						)
						break
					case 'east':
						// prettier-ignore
						uvs.push(
							(z + d) / tw, (y + h) / th,
							z / tw, (y + h) / th,
							(z + d) / tw, y / th,
							z / tw, y / th,
						)
						break
				}
			}
			texture.needsUpdate = true
		}

		geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
		geometry.attributes.uv.needsUpdate = true

		const outlineGeo = new THREE.EdgesGeometry(geometry)
		outlineGeos.push(outlineGeo)
		const elementMesh = new THREE.Mesh(geometry, materials)
		mesh.add(elementMesh)
	}

	// @ts-expect-error
	const outlineGeo = BufferGeometryUtils.mergeBufferGeometries(outlineGeos)
	const outline = new THREE.LineSegments(outlineGeo, Canvas.outlineMaterial)

	outline.no_export = true
	outline.renderOrder = 2
	outline.frustumCulled = false

	return { mesh, outline }
}

const TEXTURE_CACHE = new Map<string, THREE.Texture>()
async function loadTexture(textures: IBlockModel['textures'], key: string): Promise<THREE.Texture> {
	if (key.at(0) === '#') key = key.slice(1)
	const resourceLocation = textures[key]
	if (resourceLocation.at(0) === '#') {
		return await loadTexture(textures, resourceLocation.slice(1))
	}
	const textureUrl = getPathFromResourceLocation(resourceLocation, 'textures') + '.png'
	if (TEXTURE_CACHE.has(textureUrl)) {
		return TEXTURE_CACHE.get(textureUrl)!
	}
	const texture = await LOADER.loadAsync(getPngAssetAsDataUrl(textureUrl))
	texture.magFilter = THREE.NearestFilter
	texture.minFilter = THREE.NearestFilter
	TEXTURE_CACHE.set(textureUrl, texture)
	return texture
}
