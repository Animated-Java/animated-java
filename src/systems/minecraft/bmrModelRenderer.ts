import * as bmr from 'block-model-renderer'
import ASSETS_ZIP_URL from 'block-model-renderer/assets.zip'
import { mergeGeometries } from '../../util/bufferGeometryUtils'
import { getAssetHandler, getPreviewResourcePackKey } from './assetManager'

/** The editor-preview mesh for a vanilla item or block model. */
export interface RenderedModelMesh {
	mesh: THREE.Object3D
	outline: THREE.LineSegments
	boundingBox: THREE.BufferGeometry
	isBlock?: boolean
}

let configured = false
/** Point `block-model-renderer` at Blockbench's `THREE` and the inlined asset pack. */
export function ensureConfigured() {
	if (configured) return
	bmr.configure({ THREE, assetsUrl: ASSETS_ZIP_URL })
	configured = true
}

type PreparedAssets = Awaited<ReturnType<typeof bmr.prepareAssets>>

const PREPARED_ASSETS_CACHE = new Map<string, Promise<PreparedAssets>>()

/** A cached bmr asset bundle over the client jar (plus preview pack) for the given version. */
export async function getPreparedAssets(versionId: string): Promise<PreparedAssets> {
	// The preview resource pack overlays the client jar, so its token is part of
	// our cache key or a swapped pack keeps serving the old bundle.
	const previewKey = getPreviewResourcePackKey()
	const cacheKey = previewKey ? `${versionId}::${previewKey}` : versionId
	let prepared = PREPARED_ASSETS_CACHE.get(cacheKey)
	if (!prepared) {
		prepared = (async () => {
			const handler = await getAssetHandler(versionId)
			// bmr's { cache: true } store isn't version-aware, so `version` must be
			// pinned to `versionId` (renders pass that same value). It also can't tell
			// preview-pack overlays apart, so bypass it entirely while one is active.
			return bmr.prepareAssets([handler], { cache: !previewKey, version: versionId })
		})()
		PREPARED_ASSETS_CACHE.set(cacheKey, prepared)
	}
	return prepared
}

/** Drops every cached bmr asset bundle. Call when the preview resource pack changes. */
export function clearPreparedAssetsCache() {
	PREPARED_ASSETS_CACHE.clear()
}

function toPositionOnlyWorldGeometry(
	geometry: THREE.BufferGeometry,
	matrixWorld: THREE.Matrix4
): THREE.BufferGeometry {
	const source = geometry.index ? geometry.toNonIndexed() : geometry
	const out = new THREE.BufferGeometry()
	out.setAttribute('position', (source.getAttribute('position') as THREE.BufferAttribute).clone())
	out.applyMatrix4(matrixWorld)
	return out
}

/**
 * Removes the full front/back quads of a flat 2D item icon, so its outline follows the icon
 * instead of drawing a rectangle around it. Expects non-indexed, position-only geometry.
 */
function stripFlatBackgroundFaces(geometry: THREE.BufferGeometry): THREE.BufferGeometry {
	const position = geometry.getAttribute('position') as THREE.BufferAttribute
	const triangleCount = position.count / 3
	const size = new THREE.Box3().setFromBufferAttribute(position).getSize(new THREE.Vector3())
	const fullExtentArea = size.x * size.y * 0.49

	const a = new THREE.Vector3()
	const b = new THREE.Vector3()
	const c = new THREE.Vector3()
	const kept: number[] = []
	let strippedAny = false

	for (let i = 0; i < triangleCount; i++) {
		a.fromBufferAttribute(position, i * 3)
		b.fromBufferAttribute(position, i * 3 + 1)
		c.fromBufferAttribute(position, i * 3 + 2)

		const cross = b.clone().sub(a).cross(c.clone().sub(a))
		const doubleArea = cross.length()
		const isFlatBackgroundFace =
			doubleArea >= fullExtentArea * 2 && Math.abs(cross.z) >= doubleArea * 0.999

		if (isFlatBackgroundFace) {
			strippedAny = true
			continue
		}
		kept.push(i * 3, i * 3 + 1, i * 3 + 2)
	}

	if (!strippedAny) return geometry
	const stripped = geometry.clone()
	stripped.setIndex(kept)
	return stripped
}

/**
 * Converts a bmr model group into the outliner's expected structure. bmr builds
 * in Minecraft space (origin-centered, 16u/block); Blockbench's is that rotated
 * 180° around Y. `pivot` picks the block (corner) or item (center) origin.
 */
export function convertBmrGroup(
	root: THREE.Object3D,
	options: { pivot: 'center' | 'corner'; isBlock?: boolean }
): RenderedModelMesh {
	const wrapper = new THREE.Group()
	if (!options.isBlock) {
		// Only rotate non-block models around the Y axis.
		wrapper.rotation.y = Math.PI
	}
	if (options.pivot === 'corner') wrapper.position.set(8, 8, 8)
	wrapper.add(root)
	wrapper.updateMatrixWorld(true)

	const edgeGeometries: THREE.BufferGeometry[] = []
	const boxGeometries: THREE.BufferGeometry[] = []

	wrapper.traverse(object => {
		const mesh = object as THREE.Mesh
		if (!mesh.isMesh || !mesh.geometry) return

		// The enchantment glint overlay reads `material.map`; bmr keeps it on a uniform.
		const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
		for (const mat of materials as Array<THREE.ShaderMaterial & { map?: THREE.Texture }>) {
			if (mat && !mat.map && mat.uniforms?.map?.value) {
				mat.map = mat.uniforms.map.value as THREE.Texture
			}
		}

		const worldGeometry = toPositionOnlyWorldGeometry(mesh.geometry, mesh.matrixWorld)
		boxGeometries.push(worldGeometry)
		const edgeSourceGeometry = options.isBlock
			? worldGeometry
			: stripFlatBackgroundFaces(worldGeometry)
		edgeGeometries.push(new THREE.EdgesGeometry(edgeSourceGeometry))
	})

	const boundingBox = boxGeometries.length
		? mergeGeometries(boxGeometries)!
		: new THREE.BufferGeometry()

	const outlineGeometry = edgeGeometries.length
		? mergeGeometries(edgeGeometries)!
		: new THREE.BufferGeometry()
	const outline = new THREE.LineSegments(outlineGeometry, Canvas.outlineMaterial)
	outline.no_export = true
	outline.renderOrder = 2
	outline.frustumCulled = false

	return {
		mesh: wrapper,
		outline,
		boundingBox,
		isBlock: options.isBlock ? true : undefined,
	}
}

/** A per-element copy of a cached template; geometry and materials are shared. */
export function cloneRenderedModel(template: RenderedModelMesh, name: string): RenderedModelMesh {
	const mesh = template.mesh.clone(true)
	mesh.name = name

	const flag = template.isBlock ? 'isVanillaBlockModel' : 'isVanillaItemModel'
	mesh[flag] = true
	mesh.traverse(object => {
		if ((object as THREE.Mesh).isMesh) object[flag] = true
	})

	return {
		mesh,
		outline: template.outline.clone(),
		boundingBox: template.boundingBox.clone(),
		isBlock: template.isBlock,
	}
}

export { bmr }
