/**
 * A palette strip's colors as `#rrggbbaa`, one per pixel in reading order. Minecraft only cares
 * about pixel order, so a strip of any shape flattens to this.
 */
export type PaletteColors = string[]

export function toHex(r: number, g: number, b: number, a = 255): string {
	return '#' + [r, g, b, a].map(v => v.toString(16).padStart(2, '0')).join('')
}

/** Parses `#rgb`, `#rrggbb` or `#rrggbbaa` into `[r, g, b, a]`. */
export function parseHex(hex: string): [number, number, number, number] {
	let value = hex.replace(/^#/, '')
	if (value.length === 3) value = [...value].map(c => c + c).join('')
	if (value.length === 6) value += 'ff'
	const n = parseInt(value, 16)
	return [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255]
}

export function colorsFromPixels(data: Uint8ClampedArray): PaletteColors {
	const colors: PaletteColors = []
	for (let i = 0; i < data.length; i += 4) {
		colors.push(toHex(data[i], data[i + 1], data[i + 2], data[i + 3]))
	}
	return colors
}

export function pixelsFromColors(colors: PaletteColors): Uint8ClampedArray {
	const data = new Uint8ClampedArray(colors.length * 4)
	colors.forEach((color, i) => data.set(parseHex(color), i * 4))
	return data
}

const rgbOf = (data: Uint8ClampedArray, i: number) =>
	(data[i] << 16) | (data[i + 1] << 8) | data[i + 2]

/** Key RGB -> index into the palette. Like Minecraft, transparent key pixels are skipped and a
 * repeated key color maps to its last position. */
function keyLookup(key: PaletteColors): Map<number, number> {
	const lookup = new Map<number, number>()
	key.forEach((color, i) => {
		const [r, g, b, a] = parseHex(color)
		if (a) lookup.set((r << 16) | (g << 8) | b, i)
	})
	return lookup
}

/**
 * Recolors RGBA pixels the way Minecraft's `paletted_permutations` atlas source does: an opaque or
 * translucent pixel whose RGB matches a key color takes the palette color at the same index, with
 * alpha `floor(pixel alpha * palette alpha / 255)`. Everything else is copied as-is.
 *
 * Throws if the palette's length differs from the key's, since Minecraft skips the sprite then.
 */
export function recolor(
	base: Uint8ClampedArray,
	key: PaletteColors,
	palette: PaletteColors
): Uint8ClampedArray {
	if (key.length !== palette.length) {
		throw new Error(`Palette has ${palette.length} colors, but its key has ${key.length}`)
	}
	const lookup = keyLookup(key)
	const colors = palette.map(parseHex)
	const out = new Uint8ClampedArray(base)
	for (let i = 0; i < out.length; i += 4) {
		const alpha = out[i + 3]
		if (!alpha) continue
		const index = lookup.get(rgbOf(out, i))
		if (index === undefined) continue
		const [r, g, b, a] = colors[index]
		out[i] = r
		out[i + 1] = g
		out[i + 2] = b
		out[i + 3] = Math.floor((alpha * a) / 255)
	}
	return out
}

const luminance = (rgb: number) =>
	0.2126 * ((rgb >> 16) & 255) + 0.7152 * ((rgb >> 8) & 255) + 0.0722 * (rgb & 255)

/**
 * Builds a palette key from the unique colors of every non-transparent pixel in `images`, sorted
 * light to dark like vanilla's keys. Ties sort by RGB value, so the order is stable.
 */
export function extractKey(images: Uint8ClampedArray[]): PaletteColors {
	const seen = new Set<number>()
	for (const data of images) {
		for (let i = 0; i < data.length; i += 4) {
			if (data[i + 3]) seen.add(rgbOf(data, i))
		}
	}
	return [...seen]
		.sort((a, b) => luminance(b) - luminance(a) || b - a)
		.map(rgb => toHex((rgb >> 16) & 255, (rgb >> 8) & 255, rgb & 255))
}

/**
 * Merges newly extracted key colors into an existing key: existing colors keep their positions,
 * so palettes made for the old key still line up, and new ones go on the end.
 */
export function mergeKey(existing: PaletteColors, extracted: PaletteColors): PaletteColors {
	const rgb = (color: string) => color.slice(0, 7).toLowerCase()
	const known = new Set(existing.map(rgb))
	return [...existing, ...extracted.filter(color => !known.has(rgb(color)))]
}

/** Key colors (as `#rrggbb`) that appear more than once. Minecraft only uses the last of each. */
export function findDuplicateKeyColors(key: PaletteColors): string[] {
	const seen = new Set<string>()
	const duplicates = new Set<string>()
	for (const color of key) {
		if (!parseHex(color)[3]) continue
		const rgb = color.slice(0, 7).toLowerCase()
		if (seen.has(rgb)) duplicates.add(rgb)
		seen.add(rgb)
	}
	return [...duplicates]
}
