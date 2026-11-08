import { UnicodeString, type StyledSegment, type TextComponentStyle } from 'book-and-quill'
import MissingCharacter from '../../assets/missing_character.png'
import { getPathFromResourceLocation } from '../../util/minecraftUtil'
import { getAllJSONAssets, getJSONAsset, getPngAsset, getRawAsset } from './assetManager'
import { parseTrueTypeFont, type TrueTypeFontInfo } from './trueTypeFont'

namespace MinecraftJson {
	export interface FontProviderBitmap {
		type: 'bitmap'
		file: string
		height?: number
		ascent: number
		chars: string[]
	}

	export interface FontProviderReference {
		type: 'reference'
		id: string
		filter?: {
			uniform?: boolean
		}
	}

	export interface FontProviderSpace {
		type: 'space'
		advances: Record<string, number>
	}

	export interface FontProviderTrueType {
		type: 'ttf'
		file: string
		size?: number
		oversample?: number
		shift?: [number, number]
		skip?: string | string[]
	}

	export type FontProvider =
		| FontProviderBitmap
		| FontProviderReference
		| FontProviderSpace
		| FontProviderTrueType

	export interface Font {
		providers: FontProvider[]
	}
}

interface CachedBitmapChar {
	type: 'bitmap'
	ascent: number
	width: number
	/** Factor from atlas pixels to rendered pixels (`height` field / native cell height). */
	scale: number
	/** Left edge of the glyph quad relative to the pen, in rendered pixels. */
	bearingX?: number
	atlas: THREE.Texture
	bitmapUV: {
		x: number
		y: number
		width: number
		height: number
	}
}

interface CachedSpaceChar {
	type: 'space'
	width: number
}

export type CachedChar = CachedBitmapChar | CachedSpaceChar

const MISSING_CHARACTER_TEXTURE = new THREE.TextureLoader().load(MissingCharacter)
MISSING_CHARACTER_TEXTURE.magFilter = THREE.NearestFilter
MISSING_CHARACTER_TEXTURE.minFilter = THREE.NearestFilter
MISSING_CHARACTER_TEXTURE.generateMipmaps = false
function createMissingCharacter(): CachedBitmapChar {
	return {
		type: 'bitmap',
		ascent: 7,
		width: 6,
		scale: 1,
		atlas: MISSING_CHARACTER_TEXTURE,
		bitmapUV: { x: 0, y: 0, width: 8, height: 8 },
	}
}

/** Samples glyph atlases as crisp pixels, keeping colours (emoji fonts) accurate. */
function configureGlyphTexture(texture: THREE.Texture) {
	texture.magFilter = THREE.NearestFilter
	texture.minFilter = THREE.NearestFilter
	texture.generateMipmaps = false
	if ('colorSpace' in texture) {
		;(texture as any).colorSpace = (THREE as any).SRGBColorSpace
	} else if ('encoding' in texture) {
		;(texture as any).encoding = (THREE as any).sRGBEncoding
	}
}

abstract class FontProvider {
	type: MinecraftJson.FontProvider['type']
	loaded = false

	constructor(providerJSON: MinecraftJson.FontProvider) {
		this.type = providerJSON.type
	}

	abstract load(): Promise<this> | this

	abstract getChar(char: string): CachedChar | undefined

	/** Frees resources held outside the JS heap (registered fonts, GPU textures). */
	dispose() {
		// Most providers only hold JS-heap data.
	}

	static async fromAssetPath(assetPath: string) {
		if (!assetPath.endsWith('.json')) assetPath += '.json'
		const providerJSON = (await getJSONAsset(
			Project.animated_java.target_minecraft_version,
			assetPath
		)) as MinecraftJson.FontProvider
		switch (providerJSON.type) {
			case 'bitmap':
				return new BitmapFontProvider(providerJSON)
			case 'reference':
				return new ReferenceFontProvider(providerJSON)
			case 'space':
				return new SpaceFontProvider(providerJSON)
			case 'ttf':
				return new TrueTypeFontProvider(providerJSON)
			default:
				throw new Error(
					`Unsupported font provider type: ${(providerJSON as any).type as string}`
				)
		}
	}
}

class ReferenceFontProvider extends FontProvider {
	reference: MinecraftFont

	constructor(providerJSON: MinecraftJson.FontProviderReference) {
		super(providerJSON)
		const path = getPathFromResourceLocation(providerJSON.id, 'font')
		// Reuse a registered font so clearFontCache can still reach (and dispose) it.
		this.reference =
			MinecraftFont.all.get(providerJSON.id) ??
			new MinecraftFont(providerJSON.id, path + '.json')
	}

	async load() {
		if (this.loaded) return this
		await this.reference.load()
		this.loaded = true
		return this
	}

	getChar(char: string): CachedChar | undefined {
		const cached = this.reference.getChar(char)
		if (cached.type === 'bitmap' && cached.atlas === MISSING_CHARACTER_TEXTURE) {
			return undefined
		}
		return cached
	}
}

class SpaceFontProvider extends FontProvider {
	advances: Record<string, number>

	constructor(providerJSON: MinecraftJson.FontProviderSpace) {
		super(providerJSON)
		this.advances = providerJSON.advances
	}

	load() {
		if (this.loaded) return this
		this.loaded = true
		return this
	}

	getChar(char: string): CachedChar | undefined {
		if (this.advances[char] !== undefined) {
			return {
				type: 'space',
				width: this.advances[char],
			}
		}
	}
}

class BitmapFontProvider extends FontProvider {
	bitmapPath: string
	/** Native cell height in atlas pixels (set once the atlas loads). */
	charHeight: number
	charWidth: number
	/** Target render height in pixels (Minecraft's `height` field, default 8). */
	renderHeight: number
	ascent: number
	chars: UnicodeString[] = []

	atlas: THREE.Texture = THREE.Texture.DEFAULT_IMAGE
	canvas: HTMLCanvasElement = document.createElement('canvas')

	providerJSON: MinecraftJson.FontProviderBitmap

	private charCache = new Map<string, CachedChar>()

	constructor(providerJSON: MinecraftJson.FontProviderBitmap) {
		super(providerJSON)
		this.providerJSON = providerJSON
		this.type = providerJSON.type
		this.bitmapPath = getPathFromResourceLocation(providerJSON.file, 'textures')
		this.renderHeight = providerJSON.height ?? 8
		this.charHeight = this.renderHeight
		this.charWidth = 8
		this.ascent = providerJSON.ascent
		for (const row of providerJSON.chars) {
			const str = new UnicodeString(row)
			// console.log({ row, str })
			this.chars.push(str)
		}
	}

	async load() {
		if (this.loaded) return this
		const dataUrl = await getPngAsset(
			Project.animated_java.target_minecraft_version,
			this.bitmapPath
		)
		const texture = await new THREE.TextureLoader().loadAsync(dataUrl)
		configureGlyphTexture(texture)

		this.atlas = texture
		this.charHeight = texture.image.height / this.chars.length
		this.charWidth = texture.image.width / this.chars[0].length
		if (!Number.isFinite(this.charWidth)) {
			// console.log({
			// 	providerJSON: this.providerJSON,
			// 	bitmapPath: this.bitmapPath,
			// 	imageWidth: texture.image.width,
			// 	charsPerRow: this.chars[0].length,
			// 	calculatedCharWidth: this.charWidth,
			// 	chars: this.chars,
			// 	texture,
			// })
			throw new Error(
				`Invalid character width calculated from bitmap font atlas: ${this.charWidth}`
			)
		}
		// Update canvas
		this.canvas.width = texture.image.width
		this.canvas.height = texture.image.height
		const ctx = this.canvas.getContext('2d', { willReadFrequently: true })!
		ctx.drawImage(this.atlas.image, 0, 0)
		this.loaded = true
		return this
	}

	private getCharIndex(char: string): ArrayVector2 {
		for (const row of this.chars) {
			if (row.includes(char)) {
				return [this.chars.indexOf(row), row.indexOf(char)]
			}
		}
		return [-1, -1]
	}

	getChar(char: string): CachedChar | undefined {
		const cached = this.charCache.get(char)
		if (cached) return cached

		const charPos = this.getCharIndex(char)
		if (charPos[0] === -1) return

		const startX = charPos[1] * this.charWidth
		const startY = charPos[0] * this.charHeight
		const data = this.canvas
			.getContext('2d')!
			.getImageData(startX, startY, this.charWidth, this.charHeight)
		// Figure out how wide the character is by checking for the last non-transparent pixel
		let width = 0
		for (let x = 0; x < this.charWidth; x++) {
			for (let y = 0; y < this.charHeight; y++) {
				const i = (y * this.charWidth + x) * 4
				if (data.data[i + 3] > 0) {
					width = x + 1
					break
				}
			}
		}

		if (width === 0) {
			// Character is completely transparent, treat it as missing
			return createMissingCharacter()
		}

		// Glyphs are scaled from their native atlas cell to the provider's `height`.
		const scale = this.renderHeight / this.charHeight

		this.charCache.set(char, {
			type: 'bitmap',
			ascent: this.ascent,
			// Advance is the scaled glyph width plus 1px of inter-character spacing.
			width: Math.round(width * scale) + 1,
			scale,
			atlas: this.atlas,
			bitmapUV: {
				x: startX,
				y: startY,
				width,
				height: this.charHeight,
			},
		})

		return this.charCache.get(char)!
	}
}

const GLYPH_ATLAS_SIZE = 512
const GLYPH_ATLAS_PADDING = 1

interface GlyphAtlasPage {
	texture: THREE.DataTexture
	data: Uint8Array
	size: number
	shelfX: number
	shelfY: number
	shelfHeight: number
}

/**
 * Shelf-packed pages that rasterized glyphs are copied into, so every glyph of
 * a font shares a few textures (one draw batch each). Pages never resize, so a
 * glyph's UVs stay valid as more are added.
 */
class GlyphAtlas {
	private pages: GlyphAtlasPage[] = []

	/** Copies a glyph's coverage (the alpha of `rgba`) in as `(a, a, a, a)`, matching
	 * the `.rrrr` sample Minecraft's text shader takes of grayscale glyphs. */
	add(width: number, height: number, rgba: Uint8ClampedArray) {
		const page = this.findSpace(width, height)
		const x = page.shelfX
		const y = page.shelfY
		for (let row = 0; row < height; row++) {
			// Rows are stored bottom-up (DataTextures don't flipY), so the image-space
			// `v = 1 - y / height` the renderer uses still lands on this glyph.
			const destRow = (page.size - 1 - (y + row)) * page.size
			for (let col = 0; col < width; col++) {
				const alpha = rgba[(row * width + col) * 4 + 3]
				page.data.fill(alpha, (destRow + x + col) * 4, (destRow + x + col + 1) * 4)
			}
		}
		page.shelfX += width + GLYPH_ATLAS_PADDING
		page.shelfHeight = Math.max(page.shelfHeight, height)
		page.texture.needsUpdate = true
		return { texture: page.texture, x, y }
	}

	dispose() {
		for (const page of this.pages) page.texture.dispose()
		this.pages = []
	}

	private findSpace(width: number, height: number): GlyphAtlasPage {
		const page = this.pages.at(-1)
		if (page) {
			if (page.shelfX + width > page.size) {
				page.shelfY += page.shelfHeight + GLYPH_ATLAS_PADDING
				page.shelfX = 0
				page.shelfHeight = 0
			}
			if (page.shelfX + width <= page.size && page.shelfY + height <= page.size) return page
		}
		return this.addPage(Math.max(width, height))
	}

	private addPage(minSize: number): GlyphAtlasPage {
		let size = GLYPH_ATLAS_SIZE
		while (size < minSize) size *= 2
		const data = new Uint8Array(size * size * 4)
		const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat)
		configureGlyphTexture(texture)
		const page = { texture, data, size, shelfX: 0, shelfY: 0, shelfHeight: 0 }
		this.pages.push(page)
		return page
	}
}

const isAtLeastVersion = (version: string, minimum: string) => !compareVersions(minimum, version)

/**
 * Minecraft's `ttf` provider. Glyphs are drawn by the browser (the file is
 * registered through `FontFace`) but placed with Minecraft's own math, which
 * depends on the target version's rasterizer:
 *
 * - 1.20.5+ uses FreeType: the em is `round(size * oversample)` px, advances are
 *   hinted to whole pixels, and only TrueType (`glyf`) outlines load.
 * - 1.20.4 uses stb_truetype: ascent-to-descent spans `size * oversample` px,
 *   advances are fractional, only the BMP is covered, and `shift` (plus the
 *   left side bearing) is counted twice.
 */
class TrueTypeFontProvider extends FontProvider {
	private static nextFamilyId = 0

	private filePath: string
	private size: number
	private oversample: number
	private shiftX: number
	private shiftY: number
	private skip: Set<number>

	private info: TrueTypeFontInfo | undefined
	private rasterizer: 'freetype' | 'stb' = 'freetype'
	private emPx = 0
	private ascentPx = 0
	private family = `animated-java-ttf-${TrueTypeFontProvider.nextFamilyId++}`
	private face: FontFace | undefined
	private atlas = new GlyphAtlas()
	private canvas = document.createElement('canvas')
	private ctx = this.canvas.getContext('2d', { willReadFrequently: true })!
	private charCache = new Map<string, CachedChar | null>()

	constructor(providerJSON: MinecraftJson.FontProviderTrueType) {
		super(providerJSON)
		this.filePath = getPathFromResourceLocation(providerJSON.file, 'font')
		this.size = providerJSON.size ?? 11
		this.oversample = providerJSON.oversample ?? 1
		this.shiftX = providerJSON.shift?.[0] ?? 0
		this.shiftY = providerJSON.shift?.[1] ?? 0
		const skip = providerJSON.skip ?? ''
		const skipped = Array.isArray(skip) ? skip.join('') : skip
		this.skip = new Set(Array.from(skipped, char => char.codePointAt(0)!))
	}

	async load() {
		if (this.loaded) return this
		const version = Project.animated_java.target_minecraft_version
		// A copy in its own ArrayBuffer: FontFace takes the whole buffer, not the view.
		const data = new Uint8Array(await getRawAsset(version, this.filePath))
		const info = parseTrueTypeFont(data)

		this.rasterizer = isAtLeastVersion(version, '1.20.5') ? 'freetype' : 'stb'
		if (this.rasterizer === 'freetype' && info.outlines === 'cff') {
			throw new Error(
				`'${this.filePath}' uses CFF outlines, which Minecraft ${version} can't load (only TrueType outlines are supported)`
			)
		}

		const pixelSize = this.size * this.oversample
		if (this.rasterizer === 'freetype') {
			this.emPx = Math.round(pixelSize)
		} else {
			const scale = pixelSize / (info.ascender - info.descender)
			this.emPx = scale * info.unitsPerEm
			this.ascentPx = info.ascender * scale
		}
		if (!(this.emPx > 0)) {
			throw new Error(`Invalid ttf size ${this.size} x oversample ${this.oversample}`)
		}

		const face = new FontFace(this.family, data)
		await face.load()
		document.fonts.add(face)
		this.face = face
		this.info = info
		this.loaded = true
		return this
	}

	dispose() {
		if (this.face) document.fonts.delete(this.face)
		this.face = undefined
		this.atlas.dispose()
		this.charCache.clear()
	}

	getChar(char: string): CachedChar | undefined {
		// Disposed (cache cleared mid-render): the canvas would draw a system fallback font.
		if (!this.face) return undefined
		const cached = this.charCache.get(char)
		if (cached !== undefined) return cached ?? undefined

		const codePoint = char.codePointAt(0)!
		const covered =
			!!this.info?.codePoints.has(codePoint) &&
			!this.skip.has(codePoint) &&
			(this.rasterizer === 'freetype' || codePoint <= 0xffff)
		const result = covered ? this.rasterize(char) : null
		this.charCache.set(char, result)
		return result ?? undefined
	}

	private rasterize(char: string): CachedChar {
		const oversample = this.oversample
		const shiftX = this.shiftX * oversample
		const shiftY = this.shiftY * oversample
		const font = `${this.emPx}px "${this.family}"`
		this.ctx.font = font
		const metrics = this.ctx.measureText(char)

		// The glyph's pixel box relative to the pen (y down), shifted then snapped
		// outwards - FreeType's bitmap box and stb's GetGlyphBitmapBoxSubpixel agree.
		const left = Math.floor(-metrics.actualBoundingBoxLeft + shiftX)
		const right = Math.ceil(metrics.actualBoundingBoxRight + shiftX)
		const top = Math.floor(-metrics.actualBoundingBoxAscent + shiftY)
		const bottom = Math.ceil(metrics.actualBoundingBoxDescent + shiftY)
		const width = right - left
		const height = bottom - top

		let advance: number
		let bearingX: number
		let ascent: number
		if (this.rasterizer === 'freetype') {
			advance = Math.round(metrics.width) / oversample
			bearingX = left / oversample
			ascent = -top / oversample
		} else {
			advance = metrics.width / oversample
			bearingX = (-metrics.actualBoundingBoxLeft + left + shiftX) / oversample
			// 1.20.4's bearing top, measured down from 3px above the line; 10 - it
			// converts that to the `ascent` bitmap glyphs use.
			ascent = 10 - (this.ascentPx + top + shiftY) / oversample
		}

		if (width <= 0 || height <= 0) return { type: 'space', width: advance }

		// Resizing resets the context, so set the font again afterwards.
		this.canvas.width = width
		this.canvas.height = height
		this.ctx.font = font
		this.ctx.fillStyle = '#fff'
		this.ctx.fillText(char, shiftX - left, shiftY - top)
		const pixels = this.ctx.getImageData(0, 0, width, height).data
		const slot = this.atlas.add(width, height, pixels)

		return {
			type: 'bitmap',
			ascent,
			width: advance,
			scale: 1 / oversample,
			bearingX,
			atlas: slot.texture,
			bitmapUV: { x: slot.x, y: slot.y, width, height },
		}
	}
}

export class MinecraftFont {
	static all = new Map<string, MinecraftFont>()
	private static loadedVersion: string | undefined

	id: string
	providers: FontProvider[] = []
	fallback: MinecraftFont | undefined

	private loaded = false
	private loadPromise: Promise<this> | undefined
	private assetPath: string
	private charCache = new Map<string, CachedChar>()

	constructor(id: string, assetPath: string, fallback?: MinecraftFont) {
		this.id = id
		this.assetPath = assetPath
		this.fallback = fallback

		MinecraftFont.all.set(this.id, this)
	}

	static async getById(id: string) {
		// Fonts load against one Minecraft version's assets (and, for ttf, its
		// rasterizer), so a target version change invalidates every loaded font.
		const version = Project.animated_java.target_minecraft_version
		if (version !== MinecraftFont.loadedVersion) {
			clearFontCache()
			MinecraftFont.loadedVersion = version
		}

		let font = MinecraftFont.all.get(id)

		if (!font) {
			const path = getPathFromResourceLocation(id, 'font') + '.json'
			font = new MinecraftFont(id, path)
		}

		try {
			await font.load()
		} catch (error) {
			console.error(`Failed to load font ${font.id} from ${font.assetPath}:`, error)
			return undefined
		}

		return font
	}

	load(): Promise<this> {
		if (this.loaded) return Promise.resolve(this)
		// Guard against concurrent callers (many text displays refresh at once)
		// re-entering and pushing the provider list twice.
		this.loadPromise ??= this.doLoad().catch(error => {
			this.loadPromise = undefined
			throw error
		})
		return this.loadPromise
	}

	private async doLoad() {
		if (this.loaded) return this

		// Fonts stack: a resource pack's font definition prepends its providers to
		// the ones below it (and to vanilla) rather than replacing them. Read the
		// definition from every layer and concatenate, highest priority first.
		let fontJSONs: MinecraftJson.Font[]
		try {
			fontJSONs = (await getAllJSONAssets(
				Project.animated_java.target_minecraft_version,
				this.assetPath
			)) as MinecraftJson.Font[]
		} catch (error) {
			console.error(`Failed to load font JSON from ${this.assetPath}:`, error)
			throw error
		}

		if (fontJSONs.length === 0) {
			throw new Error(`Font ${this.id} does not exist at ${this.assetPath}`)
		}

		const providerJSONs = fontJSONs.flatMap(fontJSON => fontJSON.providers ?? [])

		for (const providerJSON of providerJSONs) {
			switch (providerJSON.type) {
				case 'bitmap':
					this.providers.push(new BitmapFontProvider(providerJSON))
					break
				case 'reference':
					this.providers.push(new ReferenceFontProvider(providerJSON))
					break
				case 'space':
					this.providers.push(new SpaceFontProvider(providerJSON))
					break
				case 'ttf':
					this.providers.push(new TrueTypeFontProvider(providerJSON))
					break
				default:
					console.warn(
						`Skipping unsupported font provider type '${
							(providerJSON as any).type as string
						}' in font '${this.id}'`
					)
			}
		}

		// One broken provider (e.g. an unsupported nested type) shouldn't take down
		// the whole font - drop the failures and keep what loaded.
		const results = await Promise.allSettled(this.providers.map(provider => provider.load()))
		this.providers = this.providers.filter((provider, i) => {
			if (results[i].status === 'fulfilled') return true
			console.warn(
				`Font provider (${provider.type}) failed to load in font '${this.id}':`,
				(results[i] as PromiseRejectedResult).reason
			)
			return false
		})

		this.loaded = true
		return this
	}

	getChar(char: string): CachedChar {
		const cached = this.charCache.get(char)
		if (cached) return cached

		for (const provider of this.providers) {
			const data = provider.getChar(char)
			if (data) {
				this.charCache.set(char, data)
				return data
			}
		}

		return createMissingCharacter()
	}

	/** Advance of one code point, matching Minecraft's `StringSplitter` width
	 * provider (glyph advance + bold pixel). `style.font` must already be loaded
	 * (see {@link preloadReferencedFonts}). */
	getCodePointWidth(codePoint: string, style: TextComponentStyle): number {
		const font = this.resolveFont(style.font)
		return font.getChar(codePoint).width + (style.bold ? 1 : 0)
	}

	/** The already-loaded font `fontId` refers to, or this font if it isn't set
	 * or isn't loaded. */
	resolveFont(fontId: string | undefined): MinecraftFont {
		if (fontId && fontId !== this.id) {
			return MinecraftFont.all.get(fontId) ?? this
		}
		return this
	}
}

/**
 * Drops every loaded font (and its cached atlases/glyph metrics). Call when the
 * preview resource pack changes so custom fonts are re-read from the overlay.
 * Pair with `fontRenderer`'s `clearGlyphGeometryCache()`.
 */
export function clearFontCache() {
	for (const font of MinecraftFont.all.values()) {
		for (const provider of font.providers) provider.dispose()
	}
	MinecraftFont.all.clear()
}

/** Loads every `style.font` in `segments` up front, so the synchronous width
 * provider `wrapText` uses can resolve them. Must finish before wrapping. */
export async function preloadReferencedFonts(segments: StyledSegment[]) {
	const ids = new Set<string>()
	for (const { style } of segments) {
		if (style.font) ids.add(style.font)
	}
	await Promise.all([...ids].map(id => MinecraftFont.getById(id)))
}
