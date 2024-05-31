import { getPathFromResourceLocation, parseResourceLocation } from '../../util/minecraftUtil'
import { assetsLoaded, getJSONAsset, getPngAssetAsDataUrl } from './assetManager'
import { IItemModel } from './model'
import { TEXTURE_FRAG_SHADER, TEXTURE_VERT_SHADER } from './textureShaders'

const LOADER = new THREE.TextureLoader()
const ITEM_MODEL_CACHE = new Map<string, THREE.Mesh>()

export async function getItemModel(item: string): Promise<THREE.Mesh | undefined> {
	await assetsLoaded()
	let mesh = ITEM_MODEL_CACHE.get(item)
	if (!mesh) {
		console.warn(`Found no cached item model mesh for '${item}'`)
		mesh = await parseItemModel(getItemResourceLocation(item))
		ITEM_MODEL_CACHE.set(item, mesh)
	}
	if (!mesh) return undefined
	mesh = mesh.clone()
	mesh.geometry = mesh.geometry.clone()
	mesh.name = 'vanillaItemModel'
	mesh.isVanillaItemModel = true

	return mesh
}

function getItemResourceLocation(item: string) {
	const resource = parseResourceLocation(item)
	return resource.namespace + ':' + 'item/' + resource.path
}

async function parseItemModel(location: string, childModel?: IItemModel): Promise<THREE.Mesh> {
	const modelPath = getPathFromResourceLocation(location, 'models')
	const model = getJSONAsset(modelPath + '.json') as IItemModel

	if (childModel) {
		// if (childModel.ambientocclusion !== undefined)
		// 	model.ambientocclusion = childModel.ambientocclusion
		if (childModel.textures !== undefined) {
			model.textures ??= {}
			Object.assign(model.textures, childModel.textures)
		}
		// Interesting that elements aren't merged in vanilla...
		if (childModel.elements !== undefined) model.elements = childModel.elements
		if (childModel.display !== undefined)
			Object.assign(model.display as any, childModel.display)
		if (childModel.gui_light !== undefined) model.gui_light = childModel.gui_light
		if (childModel.overrides !== undefined) model.overrides = childModel.overrides
	}

	if (model.parent) {
		const resource = parseResourceLocation(model.parent)
		if (resource.path === 'item/generated') {
			if (!model.textures.layer0) {
				throw new Error(`No layer0 texture for generated item model '${location}'`)
			}
			const texturePath =
				getPathFromResourceLocation(model.textures.layer0, 'textures') + '.png'
			const mesh = await generateItemMesh(location, texturePath)
			return mesh
		} else {
			return await parseItemModel(model.parent, model)
		}
	}
	throw new Error(`Unsupported item model '${location}'`)
}

async function generateItemMesh(location: string, texturePath: string) {
	const textureUrl = getPngAssetAsDataUrl(texturePath)
	const texture = await LOADER.loadAsync(textureUrl)
	texture.magFilter = THREE.NearestFilter
	texture.minFilter = THREE.NearestFilter

	const mat = new THREE.ShaderMaterial({
		uniforms: {
			// @ts-ignore
			map: { type: 't', value: texture },
			// @ts-ignore
			SHADE: { type: 'bool', value: settings.shading.value },
			LIGHTCOLOR: {
				// @ts-ignore
				type: 'vec3',
				value: new THREE.Color()
					.copy(Canvas.global_light_color)
					.multiplyScalar(settings.brightness.value / 50),
			},
			// @ts-ignore
			LIGHTSIDE: { type: 'int', value: Canvas.global_light_side },
			// @ts-ignore
			EMISSIVE: { type: 'bool', value: false },
		},
		vertexShader: TEXTURE_VERT_SHADER,
		fragmentShader: TEXTURE_FRAG_SHADER,
		blending: THREE.NormalBlending,
		side: Canvas.getRenderSide(),
		transparent: true,
	})
	// @ts-ignore
	mat.map = texture
	mat.name = location

	const mesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), mat)

	const positionArray: number[] = []
	const indices: number[] = []
	const uvs = [1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 1]
	const normals: number[] = []
	const colors = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
	function addNormal(x: number, y: number, z: number) {
		normals.push(x, y, z, x, y, z, x, y, z, x, y, z)
	}

	const corners: number[][] = [
		[-texture.image.width, 0, 0],
		[-texture.image.width, 0, texture.image.height],
		[0, 0, texture.image.height],
		[0, 0, 0],
	]
	corners.push(
		...corners.map(corner => {
			return [corner[0], -1, corner[2]]
		})
	)

	corners.forEach(corner => {
		positionArray.push(...corner)
	})

	indices.push(0, 1, 2, 0, 2, 3)
	indices.push(4 + 0, 4 + 2, 4 + 1, 4 + 0, 4 + 3, 4 + 2)

	addNormal(0, 1, 0)
	addNormal(0, -1, 0)
	if (texture && texture.image.width) {
		const canvas = document.createElement('canvas')
		const ctx = canvas.getContext('2d')!
		canvas.width = texture.image.width
		canvas.height = texture.image.height
		ctx.drawImage(texture.image as HTMLImageElement, 0, 0)

		const addFace = (
			startX: number,
			startY: number,
			endX: number,
			endY: number,
			dir: number
		) => {
			const s = positionArray.length / 3
			// prettier-ignore
			positionArray.push(
					-startX, 0, startY,
					-startX, -1, startY,
					-endX, -1, endY,
					-endX, 0, endY
				)

			if (dir === 1) {
				indices.push(s + 0, s + 1, s + 2, s + 0, s + 2, s + 3)
			} else if (dir === -1) {
				indices.push(s + 0, s + 2, s + 1, s + 0, s + 3, s + 2)
			}

			if (startX == endX) {
				startX += 0.1 * -dir
				endX += 0.4 * -dir
				startY += 0.1
				endY -= 0.1
				addNormal(-dir, 0, 0)
			}
			if (startY == endY) {
				startY += 0.1 * dir
				endY += 0.4 * dir
				startX += 0.1
				endX -= 0.1
				addNormal(0, 0, -dir)
			}
			uvs.push(
				endX / canvas.width,
				1 - startY / canvas.height,
				endX / canvas.width,
				1 - endY / canvas.height,
				startX / canvas.width,
				1 - endY / canvas.height,
				startX / canvas.width,
				1 - startY / canvas.height
			)
			colors.push(1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1)
		}

		const result = ctx.getImageData(0, 0, canvas.width, canvas.height)
		const matrix1 = []
		for (let i = 0; i < result.data.length; i += 4) {
			matrix1.push(result.data[i + 3] > 140 ? 1 : 0)
		}
		const matrix2 = matrix1.slice()

		for (let y = 0; y < canvas.height; y++) {
			for (let x = 0; x <= canvas.width; x++) {
				const px0 = x == 0 ? 0 : matrix1[y * canvas.width + x - 1]
				const px1 = x == canvas.width ? 0 : matrix1[y * canvas.width + x]
				if (!px0 !== !px1) {
					addFace(x, y, x, y + 1, px0 ? 1 : -1)
				}
			}
		}

		for (let x = 0; x < canvas.width; x++) {
			for (let y = 0; y <= canvas.height; y++) {
				const px0 = y == 0 ? 0 : matrix2[(y - 1) * canvas.width + x]
				const px1 = y == canvas.height ? 0 : matrix2[y * canvas.width + x]
				if (!px0 !== !px1) {
					addFace(x, y, x + 1, y, px0 ? -1 : 1)
				}
			}
		}
	}

	positionArray.forEach((n, i) => {
		positionArray[i] = n + [8, 0.5, -8][i % 3]
	})

	mesh.geometry.setAttribute(
		'position',
		new THREE.BufferAttribute(new Float32Array(positionArray), 3)
	)
	mesh.geometry.setAttribute(
		'highlight',
		new THREE.BufferAttribute(new Uint8Array(mesh.geometry.attributes.position.count), 1)
	)
	mesh.geometry.setIndex(indices)
	mesh.geometry.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(uvs), 2))
	mesh.geometry.setAttribute('color', new THREE.BufferAttribute(new Float32Array(colors), 3))
	mesh.geometry.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(normals), 3))
	mesh.geometry.attributes.color.needsUpdate = true
	mesh.geometry.attributes.normal.needsUpdate = true

	mesh.geometry.rotateX(Math.PI / 2)

	return mesh
}
