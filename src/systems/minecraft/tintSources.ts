import type { TintColor, TintSource } from './itemDefinitions'

export type TintSourceType = TintSource['type']

interface ITintSourceTypeInfo {
	/** First Minecraft version that supports this type. */
	since: string
	/** First Minecraft version that no longer supports this type. */
	until?: string
	/**
	 * Whether an int color keeps its alpha channel. Only true for `dye` and `firework`, whose
	 * `default` is read as ARGB (MC-278626). Every other type forces its color opaque.
	 */
	alpha: boolean
}

export const TINT_SOURCE_TYPES: Record<TintSourceType, ITintSourceTypeInfo> = {
	'minecraft:constant': { since: '1.21.4', alpha: false },
	'minecraft:dye': { since: '1.21.4', alpha: true },
	'minecraft:firework': { since: '1.21.4', alpha: true },
	'minecraft:potion': { since: '1.21.4', alpha: false },
	'minecraft:map_color': { since: '1.21.4', until: '26.3', alpha: false },
	'minecraft:team': { since: '1.21.4', alpha: false },
	'minecraft:grass': { since: '1.21.4', alpha: false },
	'minecraft:custom_model_data': { since: '1.21.4', alpha: false },
}

/** The oldest Minecraft version that supports item model tints at all. */
export const TINT_SOURCES_MIN_VERSION = '1.21.4'

export function isTintSourceTypeAvailable(type: TintSourceType, version: string): boolean {
	const info = TINT_SOURCE_TYPES[type]
	if (!info) return false
	if (compareVersions(info.since, version)) return false
	return !info.until || compareVersions(info.until, version)
}

export function getAvailableTintSourceTypes(version: string): TintSourceType[] {
	return (Object.keys(TINT_SOURCE_TYPES) as TintSourceType[]).filter(type =>
		isTintSourceTypeAvailable(type, version)
	)
}

/** Opaque white, as stored for the given type. */
function getWhite(type: TintSourceType): number {
	return TINT_SOURCE_TYPES[type].alpha ? -1 : 0xffffff
}

export function createDefaultTintSource(type: TintSourceType): TintSource {
	switch (type) {
		case 'minecraft:constant':
			return { type, value: getWhite(type) }
		case 'minecraft:grass':
			return { type, temperature: 0.5, downfall: 1 }
		case 'minecraft:custom_model_data':
			return { type, index: 0, default: getWhite(type) }
		default:
			return { type, default: getWhite(type) }
	}
}

/**
 * Converts a stored tint color into the int form the dialog edits: a signed ARGB int when the type
 * keeps alpha, or an RGB int in `0..0xFFFFFF` otherwise. Float arrays become opaque.
 */
export function normalizeTintColor(color: TintColor, alpha: boolean): number {
	let int: number
	if (Array.isArray(color)) {
		const [r, g, b] = color.map(c =>
			Math.round(Math.min(Math.max(Number.isFinite(c) ? c : 0, 0), 1) * 255)
		)
		int = (0xff << 24) | (r << 16) | (g << 8) | b
	} else {
		int = Number.isFinite(color) ? Math.trunc(color) : 0
	}
	return alpha ? int | 0 : int & 0xffffff
}

/** Returns `#rrggbb`, or `#rrggbbaa` when the type keeps alpha. */
export function tintColorToHex(color: number, alpha: boolean): string {
	const rgb = (color & 0xffffff).toString(16).padStart(6, '0')
	if (!alpha) return '#' + rgb
	return '#' + rgb + (color >>> 24).toString(16).padStart(2, '0')
}

/** Parses `#rrggbb` or `#rrggbbaa` into the int form used by {@link normalizeTintColor}. */
export function tintColorFromHex(hex: string, alpha: boolean): number {
	const digits = hex.replace(/^#/, '')
	const rgb = parseInt(digits.slice(0, 6), 16) || 0
	if (!alpha) return rgb
	const a = digits.length >= 8 ? parseInt(digits.slice(6, 8), 16) : 0xff
	return (a << 24) | rgb
}

function getTintColor(tint: TintSource): TintColor | undefined {
	switch (tint.type) {
		case 'minecraft:constant':
			return tint.value
		case 'minecraft:grass':
			return undefined
		default:
			return tint.default
	}
}

function withTintColor(tint: TintSource, color: number): TintSource {
	switch (tint.type) {
		case 'minecraft:constant':
			return { ...tint, value: color }
		case 'minecraft:grass':
			return { ...tint }
		default:
			return { ...tint, default: color }
	}
}

/** Returns a copy of `tint` with its color normalized for its type. */
export function normalizeTintSource(tint: TintSource): TintSource {
	const color = getTintColor(tint)
	if (color === undefined) return { ...tint }
	return withTintColor(
		tint,
		normalizeTintColor(color, TINT_SOURCE_TYPES[tint.type]?.alpha ?? false)
	)
}

/**
 * Creates a default tint of `type`, carrying over `tint`'s color if both types have one. Alpha is
 * kept only when both types support it; otherwise the color becomes opaque.
 */
export function changeTintSourceType(tint: TintSource, type: TintSourceType): TintSource {
	const next = createDefaultTintSource(type)
	const color = getTintColor(tint)
	if (color === undefined || getTintColor(next) === undefined) return next

	const alpha = TINT_SOURCE_TYPES[type].alpha
	if (alpha && TINT_SOURCE_TYPES[tint.type]?.alpha) {
		return withTintColor(next, normalizeTintColor(color, true))
	}
	const rgb = normalizeTintColor(color, false)
	return withTintColor(next, alpha ? (0xff << 24) | rgb : rgb)
}
