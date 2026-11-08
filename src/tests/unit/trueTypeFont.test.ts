import { describe, expect, it } from '@jest/globals'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { parseTrueTypeFont } from '../../systems/minecraft/trueTypeFont'

const FONT_DIR = path.resolve(process.cwd(), 'test-packs/ttf-font-pack/assets/ajtest/font')
const readFixture = (name: string) => new Uint8Array(fs.readFileSync(path.join(FONT_DIR, name)))

/** Builds a minimal sfnt holding `head`, `hhea`, `cmap` and an outline table tag. */
function buildFont(sfntVersion: number, outlineTag: string, cmap: Uint8Array): Uint8Array {
	const head = new Uint8Array(54)
	new DataView(head.buffer).setUint16(18, 2048)
	const hhea = new Uint8Array(36)
	new DataView(hhea.buffer).setInt16(4, 1600)
	new DataView(hhea.buffer).setInt16(6, -400)
	const tables: Array<[string, Uint8Array]> = [
		[outlineTag, new Uint8Array(4)],
		['cmap', cmap],
		['head', head],
		['hhea', hhea],
	]

	let offset = 12 + tables.length * 16
	const size = offset + tables.reduce((sum, [, t]) => sum + t.length, 0)
	const out = new Uint8Array(size)
	const view = new DataView(out.buffer)
	view.setUint32(0, sfntVersion)
	view.setUint16(4, tables.length)
	tables.forEach(([tag, data], i) => {
		const record = 12 + i * 16
		for (let c = 0; c < 4; c++) view.setUint8(record + c, tag.charCodeAt(c))
		view.setUint32(record + 8, offset)
		view.setUint32(record + 12, data.length)
		out.set(data, offset)
		offset += data.length
	})
	return out
}

/** A cmap with one (3, 10) format 12 subtable of `[start, end, startGlyph]` groups. */
function format12Cmap(groups: Array<[number, number, number]>): Uint8Array {
	const out = new Uint8Array(12 + 16 + groups.length * 12)
	const view = new DataView(out.buffer)
	view.setUint16(2, 1)
	view.setUint16(4, 3)
	view.setUint16(6, 10)
	view.setUint32(8, 12)
	view.setUint16(12, 12)
	view.setUint32(16, 16 + groups.length * 12)
	view.setUint32(24, groups.length)
	groups.forEach(([start, end, glyph], i) => {
		view.setUint32(28 + i * 12, start)
		view.setUint32(32 + i * 12, end)
		view.setUint32(36 + i * 12, glyph)
	})
	return out
}

describe('parseTrueTypeFont', () => {
	it('reads a glyf font: metrics and its format 4 cmap', () => {
		const info = parseTrueTypeFont(readFixture('noto_sans.ttf'))
		expect(info.outlines).toBe('truetype')
		expect(info.unitsPerEm).toBe(1000)
		expect(info.ascender).toBe(1069)
		expect(info.descender).toBe(-293)
		expect(info.codePoints.size).toBe(53)
		for (const char of 'AZaz ') expect(info.codePoints.has(char.codePointAt(0)!)).toBe(true)
		expect(info.codePoints.has('0'.codePointAt(0)!)).toBe(false)
	})

	it('flags CFF (OTTO) fonts', () => {
		const info = parseTrueTypeFont(readFixture('stix_two_cff.otf'))
		expect(info.outlines).toBe('cff')
		expect([...info.codePoints]).toEqual([0x41])
	})

	it('reads a format 12 cmap past the BMP and ignores glyph 0', () => {
		const cmap = format12Cmap([
			[0x40, 0x42, 0],
			[0x1f600, 0x1f601, 10],
		])
		const info = parseTrueTypeFont(buildFont(0x00010000, 'glyf', cmap))
		expect([...info.codePoints].sort((a, b) => a - b)).toEqual([0x41, 0x42, 0x1f600, 0x1f601])
		expect(info.unitsPerEm).toBe(2048)
		expect(info.ascender).toBe(1600)
		expect(info.descender).toBe(-400)
	})

	it('rejects collections, non-fonts and truncated files', () => {
		const ttc = new Uint8Array(16)
		new DataView(ttc.buffer).setUint32(0, 0x74746366)
		expect(() => parseTrueTypeFont(ttc)).toThrow(/collections/)
		expect(() => parseTrueTypeFont(new TextEncoder().encode('not a font at all'))).toThrow(
			/Not a TrueType/
		)
		expect(() => parseTrueTypeFont(new Uint8Array(4))).toThrow(/too short/)
		expect(() => parseTrueTypeFont(readFixture('noto_sans.ttf').slice(0, 200))).toThrow(
			/truncated/
		)
	})

	it('rejects a font without a Unicode cmap', () => {
		const cmap = format12Cmap([[0x41, 0x41, 1]])
		new DataView(cmap.buffer).setUint16(4, 1) // platform 1 (Macintosh)
		expect(() => parseTrueTypeFont(buildFont(0x00010000, 'glyf', cmap))).toThrow(/cmap/)
	})
})
