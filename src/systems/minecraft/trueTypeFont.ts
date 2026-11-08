// Reads the parts of a TrueType / OpenType file the `ttf` font provider needs:
// which code points it maps, its outline format and its vertical metrics.
// Pure (no host globals), so it can be unit tested in plain Node.

export interface TrueTypeFontInfo {
	/** `truetype` for `glyf` outlines, `cff` for CFF/CFF2 (`OTTO`) outlines. */
	outlines: 'truetype' | 'cff'
	unitsPerEm: number
	/** `hhea` ascender, in font units (positive, above the baseline). */
	ascender: number
	/** `hhea` descender, in font units (negative, below the baseline). */
	descender: number
	/** Every code point the Unicode cmap maps to a real glyph (glyph id != 0). */
	codePoints: Set<number>
}

const SFNT_TRUETYPE = 0x00010000
const SFNT_TRUE = 0x74727565 // 'true'
const SFNT_OTTO = 0x4f54544f // 'OTTO'
const SFNT_TTCF = 0x74746366 // 'ttcf'

export function parseTrueTypeFont(data: Uint8Array): TrueTypeFontInfo {
	const view = new DataView(data.buffer, data.byteOffset, data.byteLength)
	if (view.byteLength < 12) throw new Error('Font file is too short to be a TrueType font')

	const version = view.getUint32(0)
	if (version === SFNT_TTCF) {
		throw new Error('Font collections (.ttc) are not supported')
	}
	if (version !== SFNT_TRUETYPE && version !== SFNT_TRUE && version !== SFNT_OTTO) {
		throw new Error(`Not a TrueType or OpenType font (sfnt version 0x${version.toString(16)})`)
	}

	const tables = readTableDirectory(view)
	const table = (tag: string) => {
		const offset = tables.get(tag)
		if (offset === undefined) throw new Error(`Font is missing its '${tag}' table`)
		return offset
	}

	const outlines = tables.has('glyf') ? 'truetype' : 'cff'
	if (outlines === 'cff' && !tables.has('CFF ') && !tables.has('CFF2')) {
		throw new Error('Font has neither glyf nor CFF outlines')
	}

	const head = table('head')
	const hhea = table('hhea')
	return {
		outlines,
		unitsPerEm: view.getUint16(head + 18),
		ascender: view.getInt16(hhea + 4),
		descender: view.getInt16(hhea + 6),
		codePoints: readUnicodeCmap(view, table('cmap')),
	}
}

function readTableDirectory(view: DataView): Map<string, number> {
	const numTables = view.getUint16(4)
	if (12 + numTables * 16 > view.byteLength) throw new Error('Font table directory is truncated')
	const tables = new Map<string, number>()
	for (let i = 0; i < numTables; i++) {
		const record = 12 + i * 16
		const tag = String.fromCharCode(
			view.getUint8(record),
			view.getUint8(record + 1),
			view.getUint8(record + 2),
			view.getUint8(record + 3)
		)
		const offset = view.getUint32(record + 8)
		const length = view.getUint32(record + 12)
		if (offset + length > view.byteLength) throw new Error(`Font table '${tag}' is truncated`)
		tables.set(tag, offset)
	}
	return tables
}

/** Ranks a cmap subtable: full-repertoire (format 12) Unicode first, then BMP
 * (format 4) Unicode, mirroring FreeType's preference. 0 = unusable. */
function subtableRank(platformId: number, encodingId: number, format: number): number {
	const unicode =
		platformId === 0 || (platformId === 3 && (encodingId === 1 || encodingId === 10))
	if (!unicode) return 0
	if (format === 12) return 2
	if (format === 4) return 1
	return 0
}

function readUnicodeCmap(view: DataView, cmap: number): Set<number> {
	const numSubtables = view.getUint16(cmap + 2)
	let best: { offset: number; rank: number } | undefined
	for (let i = 0; i < numSubtables; i++) {
		const record = cmap + 4 + i * 8
		const offset = cmap + view.getUint32(record + 4)
		const rank = subtableRank(
			view.getUint16(record),
			view.getUint16(record + 2),
			view.getUint16(offset)
		)
		if (rank > (best?.rank ?? 0)) best = { offset, rank }
	}
	if (!best) throw new Error('Font has no supported Unicode cmap (format 4 or 12)')

	return best.rank === 2
		? readCmapFormat12(view, best.offset)
		: readCmapFormat4(view, best.offset)
}

function readCmapFormat4(view: DataView, table: number): Set<number> {
	const codePoints = new Set<number>()
	const segCount = view.getUint16(table + 6) / 2
	const endCodes = table + 14
	const startCodes = endCodes + segCount * 2 + 2
	const idDeltas = startCodes + segCount * 2
	const idRangeOffsets = idDeltas + segCount * 2

	for (let seg = 0; seg < segCount; seg++) {
		const end = view.getUint16(endCodes + seg * 2)
		const start = view.getUint16(startCodes + seg * 2)
		const delta = view.getInt16(idDeltas + seg * 2)
		const rangeOffsetAddress = idRangeOffsets + seg * 2
		const rangeOffset = view.getUint16(rangeOffsetAddress)

		for (let code = start; code <= end && code !== 0xffff; code++) {
			let glyph: number
			if (rangeOffset === 0) {
				glyph = (code + delta) & 0xffff
			} else {
				const address = rangeOffsetAddress + rangeOffset + (code - start) * 2
				if (address + 2 > view.byteLength) break
				glyph = view.getUint16(address)
				if (glyph !== 0) glyph = (glyph + delta) & 0xffff
			}
			if (glyph !== 0) codePoints.add(code)
		}
	}
	return codePoints
}

function readCmapFormat12(view: DataView, table: number): Set<number> {
	const codePoints = new Set<number>()
	const numGroups = view.getUint32(table + 12)
	for (let i = 0; i < numGroups; i++) {
		const group = table + 16 + i * 12
		const start = view.getUint32(group)
		const end = Math.min(view.getUint32(group + 4), 0x10ffff)
		const startGlyph = view.getUint32(group + 8)
		for (let code = start; code <= end; code++) {
			if (startGlyph + (code - start) !== 0) codePoints.add(code)
		}
	}
	return codePoints
}
