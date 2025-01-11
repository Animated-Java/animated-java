import { mergeGeometries } from '../../util/bufferGeometryUtils'
import {
	IParsedBlock,
	getPathFromResourceLocation,
	parseBlock,
	resolveBlockstateValueType,
} from '../../util/minecraftUtil'
import { translate } from '../../util/translation'
import { assetsLoaded, getJSONAsset, getPngAssetAsDataUrl, hasAsset } from './assetManager'
import { BlockStateValue } from './blockstateManager'
import {
	IBlockModel,
	IBlockState,
	IBlockStateMultipartCase,
	IBlockStateMultipartCaseCondition,
	IBlockStateVariant,
} from './model'
import { TEXTURE_FRAG_SHADER, TEXTURE_VERT_SHADER } from './textureShaders'

type BlockModelMesh = {
	mesh: THREE.Mesh
	outline: THREE.LineSegments
	boundingBox: THREE.BufferGeometry
	isBlock: true
}

const LOADER = new THREE.TextureLoader()
const BLOCK_MODEL_CACHE = new Map<string, BlockModelMesh>()

const BLACKLISTED_BLOCKS = new Map([
	['water', translate('block_model_manager.fluid_warning')],
	['lava', translate('block_model_manager.fluid_warning')],

	['player_head', translate('block_model_manager.mob_head_warning')],
	['player_wall_head', translate('block_model_manager.mob_head_warning')],
	['skeleton_skull', translate('block_model_manager.mob_head_warning')],
	['skeleton_wall_skull', translate('block_model_manager.mob_head_warning')],
	['wither_skeleton_skull', translate('block_model_manager.mob_head_warning')],
	['wither_skeleton_wall_skull', translate('block_model_manager.mob_head_warning')],
	['creeper_head', translate('block_model_manager.mob_head_warning')],
	['creeper_wall_head', translate('block_model_manager.mob_head_warning')],
	['zombie_head', translate('block_model_manager.mob_head_warning')],
	['zombie_wall_head', translate('block_model_manager.mob_head_warning')],
	['dragon_head', translate('block_model_manager.mob_head_warning')],
	['dragon_wall_head', translate('block_model_manager.mob_head_warning')],
	['piglin_head', translate('block_model_manager.mob_head_warning')],
	['piglin_wall_head', translate('block_model_manager.mob_head_warning')],
])

export async function getBlockModel(block: string): Promise<BlockModelMesh | undefined> {
	await assetsLoaded()
	let result = BLOCK_MODEL_CACHE.get(block)
	if (!result) {
		// console.warn(`Found no cached item model mesh for '${block}'`)
		const parsed = await parseBlock(block)
		if (!parsed) return undefined
		if (BLACKLISTED_BLOCKS.has(block)) {
			throw new Error(BLACKLISTED_BLOCKS.get(block))
		}
		result = await parseBlockState(parsed)
		BLOCK_MODEL_CACHE.set(block, result)
	}
	if (!result) return undefined
	result = {
		mesh: result.mesh.clone(true),
		outline: result.outline.clone(true),
		boundingBox: result.boundingBox.clone(),
		isBlock: true,
	}
	for (const child of result.mesh.children as THREE.Mesh[]) {
		child.geometry = child.geometry.clone()
	}
	result.mesh.geometry = result.mesh.geometry.clone()
	result.mesh.name = block
	result.mesh.isVanillaBlockModel = true
	return result
}

export async function parseBlockModel(
	variant: IBlockStateVariant,
	childModel?: IBlockModel
): Promise<BlockModelMesh> {
	const modelPath = getPathFromResourceLocation(variant.model, 'models')
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
		const parentVariant = { ...variant, model: model.parent }
		return await parseBlockModel(parentVariant, model)
	}

	return await generateModelMesh(variant, model)
}

async function generateModelMesh(
	variant: IBlockStateVariant,
	model: IBlockModel
): Promise<BlockModelMesh> {
	console.log(`Generating block mesh for '${variant.model}' from `, variant, model)

	if (!model.elements) {
		throw new Error(`No elements defined in block model '${variant.model}'`)
	}
	if (!model.textures) {
		throw new Error(`No textures defined in block model '${variant.model}'`)
	}

	const mesh: THREE.Mesh = new THREE.Mesh()
	const boundingBoxes: THREE.BufferGeometry[] = []
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

			const origin = element.rotation.origin
			if (origin) {
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
		// geometry.rotateY(Math.degToRad(180))
		if (variant.x) geometry.rotateX(Math.degToRad(variant.x))
		if (variant.y) geometry.rotateY(-Math.degToRad(variant.y))
		if (variant.isItemModel) {
			geometry.translate(0, 8, 0)
		} else {
			geometry.translate(8, 8, 8)
		}

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
			throw new Error(`No faces defined in element for block model '${variant.model}'`)
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
			material.name = variant.model
			materials.push(material)

			// UVs are always based on 16x16 texture width, not the actual texture size
			const tw = 16
			const th = 16
			// const tw = texture.image.width
			// const th = texture.image.height
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

		boundingBoxes.push(geometry.clone())
		const outlineGeo = new THREE.EdgesGeometry(geometry)
		outlineGeos.push(outlineGeo)
		const elementMesh = new THREE.Mesh(geometry, materials)
		mesh.add(elementMesh)
	}

	const outlineGeo = mergeGeometries(outlineGeos)!
	const outline = new THREE.LineSegments(outlineGeo, Canvas.outlineMaterial)
	const boundingBox = mergeGeometries(boundingBoxes)!

	outline.no_export = true
	outline.renderOrder = 2
	outline.frustumCulled = false

	return { mesh, outline, boundingBox, isBlock: true }
}

const TEXTURE_CACHE = new Map<string, THREE.Texture>()
async function loadTexture(textures: IBlockModel['textures'], key: string): Promise<THREE.Texture> {
	if (key.at(0) === '#') key = key.slice(1)
	const resourceLocation = textures[key]
	if (resourceLocation?.at(0) === '#') {
		return await loadTexture(textures, resourceLocation.slice(1))
	}
	const texturePath = getPathFromResourceLocation(resourceLocation, 'textures') + '.png'
	if (TEXTURE_CACHE.has(texturePath)) {
		return TEXTURE_CACHE.get(texturePath)!
	}
	let texture: THREE.Texture
	if (hasAsset(texturePath + '.mcmeta')) {
		console.log(`Found mcmeta for texture '${texturePath}'`)

		const img = new Image()
		img.src = getPngAssetAsDataUrl(texturePath)
		const canvas = document.createElement('canvas')
		const ctx = canvas.getContext('2d')!
		await new Promise<void>(resolve => {
			img.onload = () => {
				canvas.width = img.width
				canvas.height = img.width
				ctx.drawImage(img, 0, 0)
				resolve()
			}
		})
		texture = new THREE.CanvasTexture(canvas)
	} else {
		texture = await LOADER.loadAsync(getPngAssetAsDataUrl(texturePath))
	}

	texture.magFilter = THREE.NearestFilter
	texture.minFilter = THREE.NearestFilter

	TEXTURE_CACHE.set(texturePath, texture)

	return texture
}

export async function parseBlockState(block: IParsedBlock): Promise<BlockModelMesh> {
	const path = getPathFromResourceLocation(block.resourceLocation, 'blockstates')
	const blockstate = (await getJSONAsset(path + '.json')) as IBlockState
	if (!block.blockStateRegistryEntry) {
		throw new Error(`Block state registry entry not found for '${block.resource.name}'`)
	}
	// Make sure the block has all the default states
	block.states = Object.assign({}, block.blockStateRegistryEntry.defaultStates, block.states)

	for (const [k, v] of Object.entries(block.states)) {
		if (!block.blockStateRegistryEntry.stateValues[k]) {
			throw new Error(
				`Invalid block state '${k}' for '${block.resource.name}'` +
					` Expected one of: ${Object.keys(
						block.blockStateRegistryEntry.stateValues
					).join(', ')}`
			)
		} else if (!block.blockStateRegistryEntry.stateValues[k].includes(v)) {
			throw new Error(
				`Invalid block state value '${v.toString()}' for '${k}'.` +
					` Expected one of: ${block.blockStateRegistryEntry.stateValues[k].join(', ')}`
			)
		}
	}

	if (blockstate.variants) {
		const singleVariant = blockstate.variants['']
		if (singleVariant) {
			if (Array.isArray(singleVariant)) {
				return await parseBlockModel(singleVariant[0])
			} else {
				return await parseBlockModel(singleVariant)
			}
		}

		for (const [name, variant] of Object.entries(blockstate.variants)) {
			const variantStates: Record<string, ReturnType<typeof resolveBlockstateValueType>> = {}
			const args = name.split(',')
			for (const arg of args) {
				const [key, value] = arg.trim().split('=')
				const parsedValue = resolveBlockstateValueType(value, false)
				variantStates[key] = parsedValue
			}

			const matchesState = Object.entries(variantStates).allAre(([k, v]) =>
				checkIfBlockStateMatches(block, k, v, false)
			)

			if (!matchesState) {
				continue
			}

			let model: BlockModelMesh
			if (Array.isArray(variant)) {
				model = await parseBlockModel(variant[0])
			} else {
				model = await parseBlockModel(variant)
			}
			return model
		}
	} else if (blockstate.multipart) {
		// throw new Error(`Multipart block states are not supported yet`)
		const mesh = new THREE.Mesh()
		const boundingBoxes: THREE.BufferGeometry[] = []
		const outlines: THREE.BufferGeometry[] = []
		for (const c of blockstate.multipart) {
			const result = await parseMultipartCase(block, c)
			if (!result) continue
			for (const child of result.mesh.children as THREE.Mesh[]) {
				const newChild = child.clone()
				newChild.geometry = newChild.geometry.clone()
				newChild.rotateY(result.mesh.rotation.y)
				newChild.rotateX(result.mesh.rotation.x)
				mesh.add(newChild)
				const boundingBox = result.boundingBox.clone()
				boundingBox.rotateY(result.mesh.rotation.y)
				boundingBox.rotateX(result.mesh.rotation.x)
				boundingBoxes.push(boundingBox)
			}
			const outlineGeo = result.outline.geometry.clone()
			outlineGeo.rotateY(result.mesh.rotation.y)
			outlineGeo.rotateX(result.mesh.rotation.x)
			outlines.push(outlineGeo)
		}

		if (outlines.length === 0) {
			throw new Error(
				`The selected block state for '${block.resourceLocation}' has no model!`
			)
		}

		const outlineGeo = mergeGeometries(outlines)!
		const outline = new THREE.LineSegments(outlineGeo, Canvas.outlineMaterial)
		const boundingBox = mergeGeometries(boundingBoxes)!

		outline.no_export = true
		outline.renderOrder = 2
		outline.frustumCulled = false

		return { mesh, outline, boundingBox, isBlock: true }
	}

	throw new Error(`Unsupported block state '${block.resourceLocation}'`)
}

async function parseMultipartCase(
	block: IParsedBlock,
	mpCase: IBlockStateMultipartCase
): Promise<BlockModelMesh | void> {
	if (mpCase.when) {
		const recurse = (c: IBlockStateMultipartCaseCondition): boolean => {
			if (c.OR && c.AND) {
				throw new Error(`Cannot have both OR and AND in a multipart case condition`)
			} else if (c.OR) {
				return c.OR.some(v => recurse(v))
			} else if (c.AND) {
				return c.AND.every(v => recurse(v))
			}

			let matchesState = true
			for (const [k, v] of Object.entries(c) as Array<[string, string]>) {
				const parsedValue = resolveBlockstateValueType(v, true)
				matchesState = checkIfBlockStateMatches(block, k, parsedValue, true)
				if (!matchesState) break
			}
			return matchesState
		}
		const result = recurse(mpCase.when)
		if (!result) return
	}
	if (Array.isArray(mpCase.apply)) {
		return await parseBlockModel(mpCase.apply[0])
	} else {
		return await parseBlockModel(mpCase.apply)
	}
}

function checkIfBlockStateMatches(
	block: IParsedBlock,
	key: string,
	value: BlockStateValue,
	allowArray: boolean
) {
	if (typeof value === 'string' && value.includes('|')) {
		if (!allowArray)
			throw new Error(`Unsupported OR condition in block state '${key}': '${value}'`)
		value = value.split('|')
	}

	if (typeof value === 'boolean') {
		return !!block.states[key] === value
	} else if (typeof value === 'string') {
		return block.states[key] === value
	} else if (typeof value === 'number') {
		return value === 0
			? block.states[key] === value || block.states[key] === undefined
			: block.states[key] === value
	} else if (allowArray) {
		return value.includes(block.states[key] as string | number | boolean)
	} else {
		throw new Error(`Unsupported variant state type '${typeof value}'`)
	}
}
