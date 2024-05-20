import { getPathFromResourceLocation } from '../../util/minecraftUtil'
import { assetsLoaded, getJSONAsset, getPngAssetAsDataUrl } from './assetManager'

interface IItemModel {
	parent?: string
	textures: Record<string, any> & {
		layer0: string
	}
}

const LOADER = new THREE.TextureLoader()
const ITEM_MODEL_CACHE = new Map<string, THREE.Mesh>()

export async function getItemModel(item: string): Promise<THREE.Mesh | undefined> {
	await assetsLoaded()
	if (ITEM_MODEL_CACHE.has(item)) return ITEM_MODEL_CACHE.get(item)
	const modelPath = getPathFromResourceLocation(item, 'models/item') + '.json'
	try {
		const model = getJSONAsset(modelPath) as IItemModel

		if (model.parent === 'minecraft:item/generated' || model.parent === 'item/generated') {
			delete model.parent
			const texturePath = getPathFromResourceLocation(item, 'textures/item') + '.png'
			console.warn(texturePath)
			const mesh = await generateItemMesh(item, texturePath)
			mesh.name = 'vanillaItemModel'
			ITEM_MODEL_CACHE.set(item, mesh)
			return mesh
		}
	} catch (e) {
		console.error(e)
		return undefined
	}

	return ITEM_MODEL_CACHE.get(item)
}

async function generateItemMesh(item: string, texturePath: string) {
	const textureUrl = getPngAssetAsDataUrl(texturePath)
	const texture = await LOADER.loadAsync(textureUrl)
	texture.magFilter = THREE.NearestFilter
	texture.minFilter = THREE.NearestFilter

	const mesh = new THREE.Mesh(
		new THREE.BoxGeometry(1, 1, 1),
		new THREE.MeshBasicMaterial({ map: texture, transparent: true, alphaTest: 0.1 })
	)

	const positionArray: number[] = []
	const indices = []
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

		const addFace = (sx: number, sy: number, ex: number, ey: number, dir: number) => {
			const s = positionArray.length / 3
			positionArray.push(-sx, 0, sy, -sx, -1, sy, -ex, -1, ey, -ex, 0, ey)

			if (dir == 1) {
				indices.push(s + 0, s + 1, s + 2, s + 0, s + 2, s + 3)
			} else {
				indices.push(s + 0, s + 2, s + 1, s + 0, s + 3, s + 2)
			}

			if (sx == ex) {
				sx += 0.1 * -dir
				ex += 0.4 * -dir
				sy += 0.1
				ey -= 0.1
				addNormal(-dir, 0, 0)
			}
			if (sy == ey) {
				sy += 0.1 * dir
				ey += 0.4 * dir
				sx += 0.1
				ex -= 0.1
				addNormal(0, 0, -dir)
			}
			uvs.push(
				ex / canvas.width,
				1 - sy / canvas.height,
				ex / canvas.width,
				1 - ey / canvas.height,
				sx / canvas.width,
				1 - ey / canvas.height,
				sx / canvas.width,
				1 - sy / canvas.height
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
		positionArray[i] = n + [8, 0.5, -15][i % 3]
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

	mesh.rotateX(Math.PI / 2)

	return mesh
}