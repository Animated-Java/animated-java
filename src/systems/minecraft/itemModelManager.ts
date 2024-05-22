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

		if (
			model.parent?.endsWith('item/generated') ||
			model.parent?.endsWith('item/handheld') ||
			model.parent?.endsWith('item/handheld_rod') ||
			model.parent?.endsWith('item/handheld_mace')
		) {
			delete model.parent
			const texturePath = getPathFromResourceLocation(item, 'textures/item') + '.png'
			const mesh = await generateItemMesh(item, texturePath)
			console.warn('Found no cached item model mesh for', texturePath)
			mesh.name = 'vanillaItemModel'
			mesh.isVanillaItemModel = true
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

	const vertShader = `
			attribute float highlight;
			uniform bool SHADE;
			uniform int LIGHTSIDE;
			varying vec2 vUv;
			varying float light;
			varying float lift;
			float AMBIENT = 0.5;
			float XFAC = -0.15;
			float ZFAC = 0.05;
			void main()
			{
				if (SHADE) {
					vec3 N = normalize( vec3( modelMatrix * vec4(normal, 0.0) ) );
					if (LIGHTSIDE == 1) {
						float temp = N.y;
						N.y = N.z * -1.0;
						N.z = temp;
					}
					if (LIGHTSIDE == 2) {
						float temp = N.y;
						N.y = N.x;
						N.x = temp;
					}
					if (LIGHTSIDE == 3) {
						N.y = N.y * -1.0;
					}
					if (LIGHTSIDE == 4) {
						float temp = N.y;
						N.y = N.z;
						N.z = temp;
					}
					if (LIGHTSIDE == 5) {
						float temp = N.y;
						N.y = N.x * -1.0;
						N.x = temp;
					}
					float yLight = (1.0+N.y) * 0.5;
					light = yLight * (1.0-AMBIENT) + N.x*N.x * XFAC + N.z*N.z * ZFAC + AMBIENT;
				} else {
					light = 1.0;
				}
				if (highlight == 2.0) {
					lift = 0.22;
				} else if (highlight == 1.0) {
					lift = 0.1;
				} else {
					lift = 0.0;
				}
				vUv = uv;
				vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
				gl_Position = projectionMatrix * mvPosition;
			}`
	const fragShader = `
			#ifdef GL_ES
			precision ${isApp ? 'highp' : 'mediump'} float;
			#endif
			uniform sampler2D map;
			uniform bool SHADE;
			uniform bool EMISSIVE;
			uniform vec3 LIGHTCOLOR;
			varying vec2 vUv;
			varying float light;
			varying float lift;
			void main(void)
			{
				vec4 color = texture2D(map, vUv);
				if (color.a < 0.01) discard;
				if (EMISSIVE == false) {
					gl_FragColor = vec4(lift + color.rgb * light, color.a);
					gl_FragColor.r = gl_FragColor.r * LIGHTCOLOR.r;
					gl_FragColor.g = gl_FragColor.g * LIGHTCOLOR.g;
					gl_FragColor.b = gl_FragColor.b * LIGHTCOLOR.b;
				} else {
					float light_r = (light * LIGHTCOLOR.r) + (1.0 - light * LIGHTCOLOR.r) * (1.0 - color.a);
					float light_g = (light * LIGHTCOLOR.g) + (1.0 - light * LIGHTCOLOR.g) * (1.0 - color.a);
					float light_b = (light * LIGHTCOLOR.b) + (1.0 - light * LIGHTCOLOR.b) * (1.0 - color.a);
					gl_FragColor = vec4(lift + color.r * light_r, lift + color.g * light_g, lift + color.b * light_b, 1.0);
				}
				if (lift > 0.2) {
					gl_FragColor.r = gl_FragColor.r * 0.6;
					gl_FragColor.g = gl_FragColor.g * 0.7;
				}
			}`
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
		vertexShader: vertShader,
		fragmentShader: fragShader,
		blending: THREE.NormalBlending,
		side: Canvas.getRenderSide(),
		transparent: true,
	})
	// @ts-ignore
	mat.map = texture
	mat.name = item

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

	mesh.rotateX(Math.PI / 2)

	return mesh
}
