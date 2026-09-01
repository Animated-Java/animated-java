import {
	COLORS,
	resolveComponent,
	TextComponent,
	wrapText,
	type Color,
	type ShadowColor,
	type TextComponentStyle,
} from 'book-and-quill'
import type { Alignment } from '../../outliner/textDisplay'
import { Stopwatch } from '../../util/stopwatch'
import { getJSONAsset, getPreviewResourcePackKey } from './assetManager'
import { MinecraftFont, preloadReferencedFonts, type CachedChar } from './fontManager'

// Turns a text component into THREE.js geometry.
//
// The whole thing is cache-heavy because `updateTextMesh` runs on every property
// change (typing, dragging a colour picker, toggling shadow): glyph geometry,
// resolved colours and language data survive across renders, and a component's
// full wrapped layout is cached so option-only changes skip resolve + wrap.

const DEFAULT_MAX_LINE_WIDTH = 200
const DEFAULT_BACKGROUND_COLOR = '#00000040'
const DEFAULT_ALIGNMENT: Alignment = 'center'

// Style flags packed into a nibble; keys every place a glyph's look depends on style.
const BOLD = 1
const ITALIC = 2
const UNDERLINED = 4
const STRIKETHROUGH = 8
function styleFlags(style: TextComponentStyle): number {
	return (
		(style.bold ? BOLD : 0) |
		(style.italic ? ITALIC : 0) |
		(style.underlined ? UNDERLINED : 0) |
		(style.strikethrough ? STRIKETHROUGH : 0)
	)
}

// ---------------------------------------------------------------------------
// Caches (all cleared together by clearGlyphGeometryCache)
// ---------------------------------------------------------------------------

/**
 * A glyph in glyph-local pixel space, pre-expanded to triangles so layout is
 * offset-and-copy. `tris`/`trisUV` are absent for whitespace; `decoTris` holds
 * 0-2 underline/strikethrough bars.
 */
interface GlyphGeo {
	tris?: Float32Array
	trisUV?: Float32Array
	atlas?: THREE.Texture
	decoTris: Float32Array[]
	/** Advance width in pixels (glyph advance + bold pixel). */
	width: number
}

// version -> fontId -> char -> [styleFlags 0..15]
const GLYPH_GEO_CACHE = new Map<string, Map<string, Map<string, Array<GlyphGeo | undefined>>>>()
// raw colour value -> resolved THREE colour + alpha, kept across renders
const COLOR_CACHE = new Map<string, ColorInfo>()
// version + previewPackKey -> parsed language map
const LANG_CACHE = new Map<string, Record<string, string>>()
// version + text + maxLineWidth -> wrapped, laid-out glyph list (alignment/shadow independent)
const LAYOUT_CACHE = new Map<string, TextLayout>()
const LAYOUT_CACHE_LIMIT = 48

/** Drops cached glyph geometry, colours, language data and layouts. Pair with
 * `fontManager`'s `clearFontCache()`. */
export function clearGlyphGeometryCache() {
	GLYPH_GEO_CACHE.clear()
	COLOR_CACHE.clear()
	LANG_CACHE.clear()
	LAYOUT_CACHE.clear()
}

interface ColorInfo {
	color: THREE.Color
	opacity: number
}

function colorKey(value: Color | ShadowColor): string {
	return typeof value === 'string' ? value : JSON.stringify(value)
}

/** Resolved THREE colour + alpha for an explicit colour value. Memoised across
 * renders - these come straight from an 8-bit hex so there's no rounding drift. */
function colorInfo(value: Color | ShadowColor): ColorInfo {
	let info = COLOR_CACHE.get(colorKey(value))
	if (!info) {
		const tc = TextComponent.getColor(value)
		info = { color: new THREE.Color(tc.toHexString()), opacity: tc.getAlpha() }
		COLOR_CACHE.set(colorKey(value), info)
	}
	return info
}

/** `getHexString();opacity` - the per-colour part of a batch key, as the
 * pre-merge renderer formed it. */
const infoKey = (i: ColorInfo) => i.color.getHexString() + ';' + i.opacity.toFixed(3)

async function getLangMap(version: string): Promise<Record<string, string>> {
	const cacheKey = version + '\0' + getPreviewResourcePackKey()
	let map = LANG_CACHE.get(cacheKey)
	if (!map) {
		map = (await getJSONAsset(version, 'assets/minecraft/lang/en_us.json')) as Record<
			string,
			string
		>
		LANG_CACHE.set(cacheKey, map)
	}
	return map
}

// A quad's 4 corners are BL, BR, TR, TL; expand to two triangles (BL,BR,TR then BL,TR,TL).
function quadTris(x: number, y: number, w: number, h: number): number[] {
	const x1 = x + w
	const y1 = y + h
	// prettier-ignore
	return [x, y, 0, x1, y, 0, x1, y1, 0, x, y, 0, x1, y1, 0, x, y1, 0]
}

/** Italic shear, matching Minecraft: x' = x + 0.2 * y - 1. Mutates in place. */
function shearInPlace(tris: Float32Array): void {
	for (let i = 0; i < tris.length; i += 3) {
		tris[i] = tris[i] + 0.2 * tris[i + 1] - 1
	}
}

function buildGlyphGeo(font: MinecraftFont, char: string, flags: number): GlyphGeo {
	const charData: CachedChar = font.getChar(char)
	const boldExtra = flags & BOLD ? 1 : 0
	const geo: GlyphGeo = { decoTris: [], width: charData.width + boldExtra }

	if (charData.type === 'bitmap') {
		const image = charData.atlas.image as { width: number; height: number } | undefined
		const { x: px, y: py, width: pw, height: ph } = charData.bitmapUV
		const atlasW = image && image.width > 0 ? image.width : px + pw
		const atlasH = image && image.height > 0 ? image.height : py + ph

		const glyphW = pw * charData.scale + boldExtra
		const glyphH = ph * charData.scale
		const top = charData.ascent + 1
		const tris = new Float32Array(quadTris(0, top - glyphH, glyphW, glyphH))
		if (flags & ITALIC) shearInPlace(tris)
		geo.tris = tris

		const u0 = px / atlasW
		const u1 = (px + pw) / atlasW
		// The atlas keeps flipY (loader default), so v = 1 - imageY / atlasH.
		const vTop = 1 - py / atlasH
		const vBot = 1 - (py + ph) / atlasH
		// Triangle order matching `tris`: BL, BR, TR, BL, TR, TL.
		// prettier-ignore
		geo.trisUV = new Float32Array([u0, vBot, u1, vBot, u1, vTop, u0, vBot, u1, vTop, u0, vTop])
		geo.atlas = charData.atlas
	}

	const decoWidth =
		(charData.type === 'space' ? charData.width : charData.bitmapUV.width * charData.scale) + 2
	if (flags & UNDERLINED) {
		geo.decoTris.push(new Float32Array(quadTris(-1, -1, decoWidth, 1)))
	}
	if (flags & STRIKETHROUGH) {
		const y = (charData.type === 'space' ? 7 : charData.ascent) / 2
		geo.decoTris.push(new Float32Array(quadTris(-1, y, decoWidth, 1)))
	}

	return geo
}

function getGlyphGeo(version: string, font: MinecraftFont, char: string, flags: number): GlyphGeo {
	let byFont = GLYPH_GEO_CACHE.get(version)
	if (!byFont) GLYPH_GEO_CACHE.set(version, (byFont = new Map()))
	let byChar = byFont.get(font.id)
	if (!byChar) byFont.set(font.id, (byChar = new Map()))
	let byFlags = byChar.get(char)
	if (!byFlags) byChar.set(char, (byFlags = []))
	return byFlags[flags] ?? (byFlags[flags] = buildGlyphGeo(font, char, flags))
}

// ---------------------------------------------------------------------------
// Layout (wrap + place), cached per (version, text, maxLineWidth)
// ---------------------------------------------------------------------------

interface GlyphPlacement {
	geo: GlyphGeo
	/** x offset from the line's start (alignment-independent). */
	relX: number
	/** `style.color ?? white` - looked up through {@link colorInfo} per render. */
	mainColor: Color | ShadowColor
	/** explicit `style.shadow_color`, or undefined for the derived default shadow. */
	shadowColor: ShadowColor | undefined
}

interface LineLayout {
	/** Minecraft's `Font.width(line)` - what alignment offsets are measured against. */
	width: number
	/** baseline y for this line in pixel space. */
	y: number
	glyphs: GlyphPlacement[]
}

interface TextLayout {
	/** raw `wrapText` width (widest line), before the `max(_, 1)` clamp. */
	layoutWidth: number
	/** background height in pixels: lineCount * 10 + 1. */
	height: number
	lines: LineLayout[]
}

function buildLayout(
	version: string,
	baseFont: MinecraftFont,
	segments: ReturnType<typeof resolveComponent>,
	maxLineWidth: number
): TextLayout {
	const { lines, width: layoutWidth } = wrapText(segments, maxLineWidth, (codePoint, style) =>
		baseFont.getCodePointWidth(codePoint, style)
	)

	const lineCount = lines.length || 1
	const height = lineCount * 10 + 1

	const outLines: LineLayout[] = []
	let y = height - 9
	for (const line of lines) {
		const glyphs: GlyphPlacement[] = []
		let relX = 0
		for (const segment of line.segments) {
			const style = segment.style
			const styledFont = baseFont.resolveFont(style.font)
			const flags = styleFlags(style)
			const mainColor = style.color ?? (COLORS.white as Color)
			const shadowColor = style.shadow_color
			for (const char of segment.text) {
				const geo = getGlyphGeo(version, styledFont, char, flags)
				if (geo.tris || geo.decoTris.length > 0) {
					glyphs.push({ geo, relX, mainColor, shadowColor })
				}
				relX += geo.width
			}
		}
		outLines.push({ width: line.width, y, glyphs })
		y -= 10
	}

	return { layoutWidth, height, lines: outLines }
}

// ---------------------------------------------------------------------------
// Mesh generation
// ---------------------------------------------------------------------------

export interface TextDisplayMesh {
	mesh: THREE.Mesh
	hitbox: THREE.BufferGeometry
	outline: THREE.LineSegments
}

export interface TextDisplayMeshOptions {
	jsonText: TextComponent
	/** Stable identifier for `jsonText` (e.g. its raw source string). Enables the
	 * layout cache - option-only changes then skip resolve + wrap. */
	cacheKey?: string
	maxLineWidth?: number
	backgroundColor?: tinycolor.Instance
	/** Whether or not to render any text shadow */
	shadow?: boolean
	alignment?: Alignment
}

// Minecraft's world transform for text: scale 0.4, flip 180deg, nudge +0.2px x.
// Applied as three passes (not one combined matrix) so the vertex data is
// bit-for-bit what the pre-merge renderer produced.
function transformed(geo: THREE.BufferGeometry): THREE.BufferGeometry {
	geo.scale(0.4, 0.4, 0.4)
	geo.rotateY(Math.PI)
	geo.translate(1 / 5, 0, 0)
	return geo
}

// One textured draw for every glyph sharing an atlas, coloured per vertex (RGBA)
// so many text colours collapse into a single mesh / draw call.
interface TexBatch {
	atlas: THREE.Texture
	quads: number
	pos: Float32Array
	uv: Float32Array
	col: Float32Array
	pw: number
	uw: number
	cw: number
}
/** A solid batch: decoration quads of one colour. */
interface SolidBatch {
	color: THREE.Color
	opacity: number
	quads: number
	pos: Float32Array
	pw: number
}

function writeQuadPos(
	pos: Float32Array,
	at: number,
	tris: Float32Array,
	dx: number,
	dy: number,
	dz: number
): void {
	for (let k = 0; k < 18; k += 3) {
		pos[at] = tris[k] + dx
		pos[at + 1] = tris[k + 1] + dy
		pos[at + 2] = tris[k + 2] + dz
		at += 3
	}
}

function writeTexQuad(
	b: TexBatch,
	tris: Float32Array,
	uv: Float32Array,
	dx: number,
	dy: number,
	dz: number,
	c: ColorInfo
): void {
	writeQuadPos(b.pos, b.pw, tris, dx, dy, dz)
	b.pw += 18
	b.uv.set(uv, b.uw)
	b.uw += 12
	const { r, g, b: bl } = c.color
	const a = c.opacity
	let w = b.cw
	for (let v = 0; v < 6; v++) {
		b.col[w] = r
		b.col[w + 1] = g
		b.col[w + 2] = bl
		b.col[w + 3] = a
		w += 4
	}
	b.cw = w
}

// TODO - Add support for rendering object text components
export async function generateTextDisplayMesh({
	jsonText,
	cacheKey,
	maxLineWidth = DEFAULT_MAX_LINE_WIDTH,
	backgroundColor = tinycolor(DEFAULT_BACKGROUND_COLOR),
	shadow = false,
	alignment = DEFAULT_ALIGNMENT,
}: TextDisplayMeshOptions): Promise<TextDisplayMesh> {
	const stopwatch = new Stopwatch('Generate Text Display Mesh').start()

	const version = Project.animated_java.target_minecraft_version
	const font = await MinecraftFont.getById('minecraft:default')
	if (!font) throw new Error('Could not load the default Minecraft font')

	// --- Wrap + place (cached per component) ------------------------------
	const layoutKey =
		cacheKey === undefined ? undefined : version + '\0' + maxLineWidth + '\0' + cacheKey
	let layout = layoutKey === undefined ? undefined : LAYOUT_CACHE.get(layoutKey)
	if (!layout) {
		const lang = await getLangMap(version)
		const segments = resolveComponent(jsonText, { translate: key => lang[key] })
		await preloadReferencedFonts(segments)
		layout = buildLayout(version, font, segments, maxLineWidth)
		if (layoutKey !== undefined) {
			if (LAYOUT_CACHE.size >= LAYOUT_CACHE_LIMIT) LAYOUT_CACHE.clear()
			LAYOUT_CACHE.set(layoutKey, layout)
		}
	}

	// --- Layout metrics --------------------------------------------------
	const layoutW = Math.max(layout.layoutWidth, 1)
	const width = layoutW + 1
	const height = layout.height
	const lineStartX = (lineWidth: number) =>
		alignment === 'center'
			? 1 - lineWidth / 2
			: alignment === 'right'
				? 1 + layoutW / 2 - lineWidth
				: 1 - layoutW / 2

	// The derived default shadow is 25% of the main colour. Memoised per main
	// value so it is computed once per distinct colour, not once per glyph.
	const shadowRaw = new Map<string, ColorInfo>()
	const rawShadow = (mainValue: Color | ShadowColor): ColorInfo => {
		let info = shadowRaw.get(colorKey(mainValue))
		if (!info) {
			const main = colorInfo(mainValue)
			info = { color: main.color.clone().multiplyScalar(0.25), opacity: main.opacity }
			shadowRaw.set(colorKey(mainValue), info)
		}
		return info
	}

	// --- Batches: one textured mesh per atlas for glyphs and for shadows, ---
	// coloured per vertex; decorations stay per-colour (rare, keeps their key).
	const mainGlyphs = new Map<THREE.Texture, TexBatch>()
	const shadowGlyphs = new Map<THREE.Texture, TexBatch>()
	const solids = new Map<string, SolidBatch>()

	const glyphBatchFor = (map: Map<THREE.Texture, TexBatch>, atlas: THREE.Texture) => {
		let b = map.get(atlas)
		if (!b) {
			map.set(
				atlas,
				(b = { atlas, quads: 0, pos: null!, uv: null!, col: null!, pw: 0, uw: 0, cw: 0 })
			)
		}
		return b
	}
	const mainGlyphFor = (atlas: THREE.Texture) => glyphBatchFor(mainGlyphs, atlas)
	const shadowGlyphFor = (atlas: THREE.Texture) => glyphBatchFor(shadowGlyphs, atlas)
	const solidFor = (info: ColorInfo) => {
		const key = infoKey(info)
		let b = solids.get(key)
		if (!b)
			solids.set(
				key,
				(b = { color: info.color, opacity: info.opacity, quads: 0, pos: null!, pw: 0 })
			)
		return b
	}
	const shadowInfoOf = (g: GlyphPlacement) =>
		g.shadowColor ? colorInfo(g.shadowColor) : rawShadow(g.mainColor)

	// --- Pass 1: count quads per batch (establishes solids' first-wins) ---
	for (const line of layout.lines) {
		for (const g of line.glyphs) {
			const geo = g.geo
			if (geo.tris) {
				mainGlyphFor(geo.atlas!).quads++
				if (shadow) shadowGlyphFor(geo.atlas!).quads++
			}
			if (geo.decoTris.length > 0) {
				solidFor(colorInfo(g.mainColor)).quads += geo.decoTris.length
				if (shadow) solidFor(shadowInfoOf(g)).quads += geo.decoTris.length
			}
		}
	}

	// --- Allocate ------------------------------------------------------
	for (const b of mainGlyphs.values()) {
		b.pos = new Float32Array(b.quads * 18)
		b.uv = new Float32Array(b.quads * 12)
		b.col = new Float32Array(b.quads * 24)
	}
	for (const b of shadowGlyphs.values()) {
		b.pos = new Float32Array(b.quads * 18)
		b.uv = new Float32Array(b.quads * 12)
		b.col = new Float32Array(b.quads * 24)
	}
	for (const b of solids.values()) b.pos = new Float32Array(b.quads * 18)

	// --- Pass 2: write vertices --------------------------------------
	for (const line of layout.lines) {
		const startX = lineStartX(line.width)
		const y = line.y
		for (const g of line.glyphs) {
			const geo = g.geo
			const x = startX + g.relX
			const mainInfo = colorInfo(g.mainColor)
			if (geo.tris) {
				const atlas = geo.atlas!
				writeTexQuad(mainGlyphFor(atlas), geo.tris, geo.trisUV!, x, y, 0, mainInfo)
				if (shadow) {
					writeTexQuad(
						shadowGlyphFor(atlas),
						geo.tris,
						geo.trisUV!,
						x + 1,
						y - 1,
						-0.01,
						shadowInfoOf(g)
					)
				}
			}
			if (geo.decoTris.length > 0) {
				const dm = solidFor(mainInfo)
				const sm = shadow ? solidFor(shadowInfoOf(g)) : undefined
				for (const deco of geo.decoTris) {
					writeQuadPos(dm.pos, dm.pw, deco, x, y, 0)
					dm.pw += 18
					if (sm) {
						writeQuadPos(sm.pos, sm.pw, deco, x + 1, y - 1, -0.01)
						sm.pw += 18
					}
				}
			}
		}
	}

	// --- Build THREE meshes -----------------------------------------
	const mesh = new THREE.Mesh()

	const addTexBatch = (b: TexBatch) => {
		if (b.quads === 0) return
		const g = new THREE.BufferGeometry()
		g.setAttribute('position', new THREE.BufferAttribute(b.pos, 3))
		g.setAttribute('uv', new THREE.BufferAttribute(b.uv, 2))
		g.setAttribute('color', new THREE.BufferAttribute(b.col, 4))
		transformed(g)
		const child = new THREE.Mesh(
			g,
			new THREE.MeshBasicMaterial({
				map: b.atlas,
				vertexColors: true,
				transparent: true,
				alphaTest: 0.01,
				// Minecraft text displays only draw their front face.
				side: THREE.FrontSide,
			})
		)
		child.name = 'text'
		mesh.add(child)
	}
	for (const b of mainGlyphs.values()) addTexBatch(b)
	for (const b of shadowGlyphs.values()) addTexBatch(b)

	for (const b of solids.values()) {
		if (b.quads === 0) continue
		const g = new THREE.BufferGeometry()
		g.setAttribute('position', new THREE.BufferAttribute(b.pos, 3))
		transformed(g)
		const child = new THREE.Mesh(
			g,
			new THREE.MeshBasicMaterial({
				color: b.color,
				transparent: b.opacity < 1,
				opacity: b.opacity,
				side: THREE.FrontSide,
			})
		)
		child.name = 'text'
		mesh.add(child)
	}

	const backgroundGeo = transformed(
		// Plane spanning y in [0, height], so its top edge sits 1px above the
		// first line's glyphs. -z avoids z-fighting with the text (Minecraft too).
		new THREE.PlaneBufferGeometry(width, height).translate(0.5, height / 2, -0.05)
	)
	const backgroundMesh = new THREE.Mesh(
		backgroundGeo,
		new THREE.MeshBasicMaterial({
			color: backgroundColor.toHexString(),
			opacity: backgroundColor.getAlpha(),
			transparent: true,
		})
	)
	backgroundMesh.name = 'background'
	mesh.add(backgroundMesh)

	const outline = new THREE.LineSegments(
		new THREE.EdgesGeometry(backgroundGeo),
		Canvas.outlineMaterial
	)
	outline.no_export = true
	outline.renderOrder = 2
	outline.frustumCulled = false

	stopwatch.debug({ mesh, hitbox: backgroundGeo, outline })
	return { mesh, hitbox: backgroundGeo, outline }
}
