import { UnicodeString, type StyledSegment, type TextComponentStyle } from 'book-and-quill'
import MissingCharacter from '../../assets/missing_character.png'
import { getPathFromResourceLocation } from '../../util/minecraftUtil'
import { getAllJSONAssets, getJSONAsset, getPngAsset } from './assetManager'

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

	export type FontProvider = FontProviderBitmap | FontProviderReference | FontProviderSpace

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

abstract class FontProvider {
	type: 'bitmap' | 'reference' | 'space'
	loaded = false

	constructor(providerJSON: MinecraftJson.FontProvider) {
		this.type = providerJSON.type
	}

	abstract load(): Promise<this> | this

	abstract getChar(char: string): CachedChar | undefined

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
		this.reference = new MinecraftFont(providerJSON.id, path + '.json')
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
		// Sample the atlas as crisp pixels, and keep colours (emoji fonts) accurate.
		texture.magFilter = THREE.NearestFilter
		texture.minFilter = THREE.NearestFilter
		texture.generateMipmaps = false
		if ('colorSpace' in texture) {
			;(texture as any).colorSpace = (THREE as any).SRGBColorSpace
		} else if ('encoding' in texture) {
			;(texture as any).encoding = (THREE as any).sRGBEncoding
		}

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

export class MinecraftFont {
	static all = new Map<string, MinecraftFont>()

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
