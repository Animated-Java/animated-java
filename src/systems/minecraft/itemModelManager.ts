import { type ItemDisplayMode } from '../../outliner/vanillaItemDisplay'
import {
	bmr,
	cloneRenderedModel,
	convertBmrGroup,
	ensureConfigured,
	getPreparedAssets,
	type RenderedModelMesh,
} from './bmrModelRenderer'

const ITEM_MODEL_CACHE = new Map<string, RenderedModelMesh>()
const ITEM_MODEL_PENDING = new Map<string, Promise<RenderedModelMesh>>()

export async function getItemModel(
	item: string,
	itemDisplay: ItemDisplayMode,
	minecraftVersion = Project.animated_java.target_minecraft_version
): Promise<RenderedModelMesh | undefined> {
	const cacheKey = `${minecraftVersion}|${item}|${itemDisplay}`

	let template = ITEM_MODEL_CACHE.get(cacheKey)
	if (!template) {
		let pending = ITEM_MODEL_PENDING.get(cacheKey)
		if (!pending) {
			pending = buildItemModel(item, itemDisplay, minecraftVersion)
			ITEM_MODEL_PENDING.set(cacheKey, pending)
			void pending.catch(() => undefined).finally(() => ITEM_MODEL_PENDING.delete(cacheKey))
		}
		template = await pending
		ITEM_MODEL_CACHE.set(cacheKey, template)
	}

	return cloneRenderedModel(template, item)
}

/** Drops every cached item model. Call when the preview resource pack changes. */
export function clearItemModelCache() {
	ITEM_MODEL_CACHE.clear()
	ITEM_MODEL_PENDING.clear()
}

async function buildItemModel(
	item: string,
	itemDisplay: ItemDisplayMode,
	minecraftVersion: string
): Promise<RenderedModelMesh> {
	ensureConfigured()
	const assets = await getPreparedAssets(minecraftVersion)

	const displayContext = itemDisplay === 'none' ? undefined : itemDisplay
	const models = await bmr.parseItemDefinition(assets, item, {
		version: minecraftVersion,
		display: displayContext,
	})
	if (!models.length) {
		throw new Error(`No model found for item '${item}'.`)
	}

	// 'none' = no transform; any other mode uses the model's transform for that context.
	const display =
		itemDisplay === 'none'
			? { rotation: [0, 0, 0] as [number, number, number] }
			: { type: 'fallback' as const, display: itemDisplay }

	let isBlock = false
	const root = new THREE.Group()
	for (const model of models) {
		const resolved = await bmr.resolveModelData(assets, model)
		const modelIsBlock = resolved.type === 'block'
		isBlock ||= modelIsBlock
		const group = await bmr.loadModel(null, assets, resolved, {
			display,
			lighting: modelIsBlock ? 'world' : 'item',
			version: minecraftVersion,
			animate: false, // the auto-animator can't survive the per-element clone
		})
		root.add(group)
	}

	// Item displays always pivot at the model's center, even for block items.
	return convertBmrGroup(root, { pivot: 'center', isBlock })
}
