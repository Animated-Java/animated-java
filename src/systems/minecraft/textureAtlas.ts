export type TextureAtlasEntry =
	| {
			type: 'directory'
			source: string
			prefix: string
	  }
	| {
			type: 'single'
			resource: string
			sprite?: string
	  }
	| {
			type: 'filter'
			namespace?: string
			path?: string
	  }
	| {
			type: 'unstitch'
			resource: string
			divisor_x: number
			divisor_y: number
			regions: Array<{
				sprite: string
				x: number
				y: number
				width: number
				height: number
			}>
	  }
	| {
			type: 'paletted_permutations'
			textures: string[]
			separator?: string
			palette_key: string
			permutations: Record<string, string>
	  }

export interface ITextureAtlas {
	sources: TextureAtlasEntry[]
}

/** First Minecraft version with the `items` atlas, which item models can draw from too. */
export const ITEMS_ATLAS_MIN_VERSION = '1.21.11'

/**
 * The atlases an item model can take its textures from, in the order the game looks a sprite up.
 * From {@link ITEMS_ATLAS_MIN_VERSION}, every texture of one model has to come from the same one.
 */
export function getItemModelAtlases(version: string): string[] {
	return compareVersions(ITEMS_ATLAS_MIN_VERSION, version) ? ['blocks'] : ['items', 'blocks']
}

function normalizeId(id: string) {
	return id.includes(':') ? id : 'minecraft:' + id
}

/** Like Java's `Pattern.matches`: the whole string has to match. Invalid patterns match nothing. */
function fullyMatches(pattern: string | undefined, value: string) {
	if (pattern === undefined) return true
	try {
		return new RegExp(`^(?:${pattern})$`).test(value)
	} catch {
		return false
	}
}

function addsSprite(source: TextureAtlasEntry, id: string): boolean {
	switch (source.type.replace(/^minecraft:/, '')) {
		case 'directory': {
			// Directories list every namespace, so only the prefix decides. Whether the file
			// exists is a missing-texture problem, not an atlas one.
			const { prefix = '' } = source as Extract<TextureAtlasEntry, { type: 'directory' }>
			return id.slice(id.indexOf(':') + 1).startsWith(prefix)
		}
		case 'single': {
			const s = source as Extract<TextureAtlasEntry, { type: 'single' }>
			return normalizeId(s.sprite ?? s.resource) === id
		}
		case 'unstitch': {
			const s = source as Extract<TextureAtlasEntry, { type: 'unstitch' }>
			return (s.regions ?? []).some(region => normalizeId(region.sprite) === id)
		}
		case 'paletted_permutations': {
			const s = source as Extract<TextureAtlasEntry, { type: 'paletted_permutations' }>
			const separator = s.separator ?? '_'
			const suffixes = Object.keys(s.permutations ?? {})
			return (s.textures ?? []).some(texture =>
				suffixes.some(suffix => normalizeId(texture + separator + suffix) === id)
			)
		}
		default:
			return false
	}
}

function removesSprite(source: TextureAtlasEntry, id: string): boolean {
	if (source.type.replace(/^minecraft:/, '') !== 'filter') return false
	const { namespace, path } = source as Extract<TextureAtlasEntry, { type: 'filter' }>
	const [spriteNamespace, spritePath] = id.split(':', 2)
	return fullyMatches(namespace, spriteNamespace) && fullyMatches(path, spritePath)
}

/**
 * Whether an atlas, built from `sources` in order, ends up with the sprite `id`. A `filter`
 * removes what earlier sources added.
 */
export function atlasIncludesSprite(sources: TextureAtlasEntry[], id: string): boolean {
	const sprite = normalizeId(id)
	let included = false
	for (const source of sources) {
		if (!source?.type) continue
		if (removesSprite(source, sprite)) included = false
		else if (addsSprite(source, sprite)) included = true
	}
	return included
}

/**
 * The first of `atlasNames` whose sources include the sprite `id`, or undefined if none do.
 */
export function findSpriteAtlas(
	atlases: ReadonlyMap<string, TextureAtlasEntry[]>,
	atlasNames: string[],
	id: string
): string | undefined {
	return atlasNames.find(name => atlasIncludesSprite(atlases.get(name) ?? [], id))
}

export type ItemModelAtlasProblem =
	/** Textures in none of the atlases item models can use. They render as missing. */
	| { model: string; type: 'outside'; textures: string[] }
	/** Textures from more than one atlas in one model. The game rejects the whole model. */
	| { model: string; type: 'mixed'; atlases: Record<string, string[]> }

/**
 * Finds item models whose textures Minecraft `version` can't draw: textures outside every atlas
 * item models use, or (from {@link ITEMS_ATLAS_MIN_VERSION}) textures from more than one atlas.
 */
export function findItemModelAtlasProblems(
	models: Array<{ name: string; textures: string[] }>,
	atlases: ReadonlyMap<string, TextureAtlasEntry[]>,
	version: string
): ItemModelAtlasProblem[] {
	const atlasNames = getItemModelAtlases(version)
	const problems: ItemModelAtlasProblem[] = []
	for (const model of models) {
		const outside: string[] = []
		const byAtlas: Record<string, string[]> = {}
		for (const id of new Set(model.textures)) {
			const atlas = findSpriteAtlas(atlases, atlasNames, id)
			if (atlas) (byAtlas[atlas] ??= []).push(id)
			else outside.push(id)
		}
		if (outside.length) {
			problems.push({ model: model.name, type: 'outside', textures: outside })
		} else if (Object.keys(byAtlas).length > 1) {
			problems.push({ model: model.name, type: 'mixed', atlases: byAtlas })
		}
	}
	return problems
}
