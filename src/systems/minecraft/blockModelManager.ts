import { type IParsedBlock, parseBlock } from '../../util/minecraftUtil'
import {
	bmr,
	cloneRenderedModel,
	convertBmrGroup,
	ensureConfigured,
	getPreparedAssets,
} from './bmrModelRenderer'

export interface BlockModelMesh {
	mesh: THREE.Object3D
	outline: THREE.LineSegments
	boundingBox: THREE.BufferGeometry
	isBlock: true
}

const BLOCK_MODEL_CACHE = new Map<string, BlockModelMesh>()
const BLOCK_MODEL_PENDING = new Map<string, Promise<BlockModelMesh>>()

export async function getBlockModel(
	block: string,
	minecraftVersion = Project.animated_java.target_minecraft_version
): Promise<BlockModelMesh | undefined> {
	const cacheKey = `${minecraftVersion}|${block}`

	let template = BLOCK_MODEL_CACHE.get(cacheKey)
	if (!template) {
		const parsed = await parseBlock(block)
		if (!parsed) return undefined

		let pending = BLOCK_MODEL_PENDING.get(cacheKey)
		if (!pending) {
			pending = buildBlockModel(parsed, minecraftVersion)
			BLOCK_MODEL_PENDING.set(cacheKey, pending)
			void pending.catch(() => undefined).finally(() => BLOCK_MODEL_PENDING.delete(cacheKey))
		}
		template = await pending
		BLOCK_MODEL_CACHE.set(cacheKey, template)
	}

	return cloneRenderedModel(template, block) as BlockModelMesh
}

async function buildBlockModel(
	block: IParsedBlock,
	minecraftVersion: string
): Promise<BlockModelMesh> {
	ensureConfigured()
	const assets = await getPreparedAssets(minecraftVersion)

	const data: Record<string, string> = {}
	for (const [key, value] of Object.entries(block.states)) {
		data[key] = String(value)
	}

	const models = await bmr.parseBlockstate(assets, block.resourceLocation, {
		data,
		version: minecraftVersion,
	})
	if (!models.length) {
		throw new Error(`The selected block state for '${block.resourceLocation}' has no model!`)
	}

	const root = new THREE.Group()
	for (const model of models) {
		const resolved = await bmr.resolveModelData(assets, model)
		// Skip vanilla's empty block-entity stubs; bmr's overlay carries the geometry.
		const elements = (resolved as { elements?: unknown[] }).elements
		if ((!elements || elements.length === 0) && !(resolved as { fluid?: unknown }).fluid) {
			continue
		}
		const group = await bmr.loadModel(null, assets, resolved, {
			lighting: 'world',
			version: minecraftVersion,
			animate: false, // the auto-animator can't survive the per-element clone
		})
		root.add(group)
	}

	// Block displays pivot at the block's (0,0,0) corner in game.
	const converted = convertBmrGroup(root, { pivot: 'corner', isBlock: true })
	return { ...converted, isBlock: true }
}

/** Drops every cached block model. Call when the preview resource pack changes. */
export function clearBlockModelCache() {
	BLOCK_MODEL_CACHE.clear()
	BLOCK_MODEL_PENDING.clear()
}

export function validateBlockState(block: IParsedBlock) {
	if (!block.blockStateRegistryEntry) {
		if (Object.keys(block.states).length > 0) {
			return `${block.resource.name} has no block states`
		}
	} else {
		for (const [k, v] of Object.entries(block.states)) {
			if (!block.blockStateRegistryEntry.stateValues[k]) {
				return (
					`Invalid block state '${k}' for '${block.resource.name}'` +
					` Expected one of: ${Object.keys(
						block.blockStateRegistryEntry.stateValues
					).join(', ')}`
				)
			} else if (!block.blockStateRegistryEntry.stateValues[k].includes(v)) {
				return (
					`Invalid block state value '${v.toString()}' for '${k}'.` +
					` Expected one of: ${block.blockStateRegistryEntry.stateValues[k].join(', ')}`
				)
			}
		}
	}
	return ''
}
