import { createHash } from 'crypto'
import MissingCharacter from '../../assets/missing_character.png'
import { type Alignment } from '../../outliner/textDisplay'
import { mergeGeometries } from '../../util/bufferGeometryUtils'
import EVENTS from '../../util/events'
import { getPathFromResourceLocation } from '../../util/minecraftUtil'
import { COLOR_VALUES, ComponentStyle, JsonText } from '../jsonText'
import { UnicodeString } from '../jsonText/unicodeString'
import * as assets from './assetManager'
import {
	computeTextWrapping,
	getComponentWords,
	type IComponentWord,
	type IStyleSpan,
} from './textWrapping'

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

type CachedChar = CachedBitmapChar | CachedSpaceChar

interface CachedCharGeo {
	geo?: THREE.BufferGeometry
	width: number
}

const MISSING_CHARACTER_TEXTURE = new THREE.TextureLoader().load(MissingCharacter)
function createMissingCharacter(): CachedBitmapChar {
	return {
		type: 'bitmap',
		ascent: 7,
		width: 6,
		atlas: MISSING_CHARACTER_TEXTURE,
		bitmapUV: { x: 0, y: 0, width: 8, height: 8 },
	}
}

abstract class FontProvider {
	public type: 'bitmap' | 'reference' | 'space'
	public loaded = false

	constructor(providerJSON: MinecraftJson.FontProvider) {
		this.type = providerJSON.type
	}

	abstract load(): Promise<this> | this

	abstract getChar(char: string): CachedChar | undefined

	static fromAssetPath(assetPath: string) {
		if (!assetPath.endsWith('.json')) assetPath += '.json'
		const providerJSON = assets.getJSONAsset(assetPath) as MinecraftJson.FontProvider
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
	public reference: MinecraftFont

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
	public advances: Record<string, number>

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
	public bitmapPath: string
	public charHeight: number
	public charWidth: number
	public ascent: number
	public chars: UnicodeString[] = []

	public atlas: THREE.Texture = THREE.Texture.DEFAULT_IMAGE
	public canvas: HTMLCanvasElement = document.createElement('canvas')

	private charCache = new Map<string, CachedChar>()

	constructor(providerJSON: MinecraftJson.FontProviderBitmap) {
		super(providerJSON)
		this.type = providerJSON.type
		this.bitmapPath = getPathFromResourceLocation(providerJSON.file, 'textures')
		this.charHeight = providerJSON.height ?? 8
		this.charWidth = 8
		this.ascent = providerJSON.ascent
		for (const row of providerJSON.chars) {
			this.chars.push(new UnicodeString(row))
		}
	}

	async load() {
		if (this.loaded) return this
		const dataUrl = assets.getPngAssetAsDataUrl(this.bitmapPath)
		const texture = await new THREE.TextureLoader().loadAsync(dataUrl)

		this.atlas = texture
		this.charHeight = texture.image.height / this.chars.length
		this.charWidth = texture.image.width / this.chars[0].length
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

		this.charCache.set(char, {
			type: 'bitmap',
			ascent: this.ascent,
			width: width + 1, // Add 1 pixel of spacing between characters
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
	static all: MinecraftFont[] = []

	public id: string
	public providers: FontProvider[] = []
	public fallback: MinecraftFont | undefined

	private loaded = false
	private charCache = new Map<string, CachedChar>()
	private geoCache = new Map<string, CachedCharGeo>()
	private materialCache = new Map<string, THREE.Material>()

	constructor(id: string, assetPath: string, fallback?: MinecraftFont) {
		this.id = id
		this.fallback = fallback

		let fontJSON: MinecraftJson.Font
		try {
			fontJSON = assets.getJSONAsset(assetPath) as MinecraftJson.Font
		} catch (error) {
			console.error(`Failed to load font JSON from ${assetPath}:`, error)
			throw error
		}

		for (const providerJSON of fontJSON.providers) {
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
					throw new Error(
						`Unsupported font provider type: ${(providerJSON as any).type as string}`
					)
			}
		}

		MinecraftFont.all.push(this)
	}

	static getById(id: string) {
		return MinecraftFont.all.find(font => font.id === id)
	}

	async load() {
		if (this.loaded) return this
		await Promise.all(this.providers.map(provider => provider.load()))
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

	getTextWidth(text: UnicodeString, span?: IStyleSpan) {
		let width = 0
		const boldExtra = span?.style.bold ? 1 : 0
		let font: MinecraftFont = this

		if (span?.style.font && span.style.font !== this.id) {
			const newFont = MinecraftFont.getById(span.style.font)
			if (newFont) font = newFont
		}

		for (const char of text) {
			if (char === '\n') break
			const charData = font.getChar(char)
			if (!charData) {
				console.warn('Encountered unknown character while getting text width:', char)
				continue
			}

			width += charData.width + boldExtra
		}

		return Math.max(width, 0)
	}

	getWordWidth(word: IComponentWord) {
		let width = 0
		let font: MinecraftFont = this

		for (const span of word.styles) {
			if (span.style.font && span.style.font !== this.id) {
				const newFont = MinecraftFont.getById(span.style.font)
				if (newFont) font = newFont
			}
			const text = word.text.slice(span.start, span.end)
			const textWidth = font.getTextWidth(text, span)
			width += textWidth
		}

		return Math.max(width, 0)
	}

	getColorMaterial(color: tinycolor.Instance): THREE.Material {
		const colorString = color.toHex8String()
		let material = this.materialCache.get(colorString)
		if (!material) {
			const alpha = color.getAlpha()
			console.log(colorString, alpha, color)
			if (alpha < 1) {
				material = new THREE.MeshBasicMaterial({
					color: color.toHexString(),
					transparent: true,
					opacity: alpha,
				})
			} else {
				material = new THREE.MeshBasicMaterial({ color: color.toHexString() })
			}
			this.materialCache.set(colorString, material)
		}
		return material
	}

	async generateTextDisplayMesh({
		jsonText,
		maxLineWidth,
		backgroundColor,
		backgroundAlpha,
		shadow,
		alignment,
	}: {
		jsonText: JsonText
		maxLineWidth: number
		backgroundColor: string
		backgroundAlpha: number
		/** Whether or not to render any text shadow */
		shadow?: boolean
		alignment?: Alignment
	}): Promise<{ mesh: THREE.Mesh; outline: THREE.LineSegments }> {
		console.time('drawTextToMesh')
		const mesh = new THREE.Mesh()

		const words = getComponentWords(jsonText.toJSON())
		console.log('Component words:', words)
		const { lines, backgroundWidth } = await computeTextWrapping(words, maxLineWidth)
		console.log('Computed lines:', lines)
		const width = backgroundWidth + 1
		const height = (lines.length || 1) * 10 + 1
		console.log('Text dimensions:', width, height)

		// // Debug output
		// const wordWidths = words.map(word => this.getWordWidth(word))
		// for (const word of words) {
		// 	console.log(
		// 		`${words.indexOf(word)} '${word.text.toString()}' width: ${
		// 			wordWidths[words.indexOf(word)]
		// 		}`
		// 	)
		// 	for (const span of word.styles) {
		// 		console.log(
		// 			`'${word.text.slice(span.start, span.end).toString()}' ${span.start}-${
		// 				span.end
		// 			} = `,
		// 			span.style
		// 		)
		// 	}
		// }
		// console.log('Lines:', lines, 'CanvasWidth:', maxLineWidth)
		// for (const line of lines) {
		// 	console.log('Line', lines.indexOf(line), line.width)
		// 	for (const word of line.words) {
		// 		console.log(
		// 			'Word',
		// 			line.words.indexOf(word),
		// 			`'${word.text.toString()}'`,
		// 			word.styles.map(span => span.style),
		// 			word.styles.map(
		// 				span =>
		// 					`${span.start}-${span.end} '${word.text
		// 						.slice(span.start, span.end)
		// 						.toString()}'`
		// 			)
		// 		)
		// 	}
		// }

		const backgroundGeo = new THREE.PlaneBufferGeometry(width, height)
		const backgroundMesh = new THREE.Mesh(
			backgroundGeo,
			new THREE.MeshBasicMaterial({
				color: backgroundColor,
				transparent: true,
				opacity: backgroundAlpha,
			})
		)
			.translateY(height / 2)
			.translateZ(-0.05)
		mesh.add(backgroundMesh)

		const spanGeos: THREE.BufferGeometry[] = []
		const spanMaterials: THREE.Material[] = []
		const cursor = { x: 0, y: height - 9 }
		for (const line of lines) {
			switch (alignment) {
				case 'center':
					cursor.x = -width / 2 + Math.ceil((width - line.width) / 2)
					break
				case 'right':
					cursor.x = -width / 2 + width - line.width
					break
				default:
					cursor.x = -width / 2 + 1
			}

			for (const word of line.words) {
				for (const span of word.styles) {
					const charGeos: THREE.BufferGeometry[] = []
					const shadowGeos: THREE.BufferGeometry[] = []

					const text = word.text.slice(span.start, span.end)
					for (const char of text) {
						const charGeo = this.getCharGeo(char, span.style)

						if (!charGeo) {
							console.error('Failed to get character geometry:', char)
							continue
						}

						if (charGeo.geo) {
							const clone = charGeo.geo.clone()
							clone.translate(cursor.x, cursor.y, 0)
							charGeos.push(clone)
							if (shadow) {
								const shadowGeo = charGeo.geo.clone()
								shadowGeo.translate(cursor.x + 1, cursor.y - 1, -0.01)
								shadowGeos.push(shadowGeo)
							}
						}

						cursor.x += charGeo.width
					}

					if (charGeos.length > 0) {
						spanGeos.push(mergeGeometries(charGeos)!)

						const color = JsonText.getColor(span.style.color ?? COLOR_VALUES.white)
						spanMaterials.push(this.getColorMaterial(color))

						if (shadow && shadowGeos.length > 0) {
							spanGeos.push(mergeGeometries(shadowGeos)!)

							if (span.style.shadow_color) {
								spanMaterials.push(
									this.getColorMaterial(
										JsonText.getColor(span.style.shadow_color)
									)
								)
							} else {
								// Default shadow color is 25% the brightness of the main color
								spanMaterials.push(
									this.getColorMaterial(
										// This version of tinycolor doesn't have a multiply method...
										tinycolor(
											new THREE.Color(color.toHexString())
												.multiplyScalar(0.25)
												.getHexString()
										)
									)
								)
							}
						}
					}
				}
			}

			cursor.y -= 10
		}

		if (spanGeos.length > 0) {
			const charGeo = mergeGeometries(spanGeos, true)!
			const charMesh = new THREE.Mesh(charGeo, spanMaterials)
			console.log(charGeo, spanMaterials, charMesh)
			mesh.add(charMesh)
		}

		mesh.scale.set(0.4, 0.4, 0.4)
		mesh.rotateY(Math.PI)
		mesh.translateX(1 / 5)

		const outlineGeo = new THREE.EdgesGeometry(backgroundGeo.clone().scale(0.4, 0.4, 0.4))
		const outline = new THREE.LineSegments(outlineGeo, Canvas.outlineMaterial)
		const positions = Array.from(outlineGeo.getAttribute('position').array)
		for (let i = 0; i < positions.length; i += 3) {
			positions[i] -= 1 / 5
			positions[i + 1] += (height / 2) * 0.4
		}
		outlineGeo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))

		outline.no_export = true
		outline.renderOrder = 2
		outline.frustumCulled = false

		mesh.isTextDisplayText = true

		console.timeEnd('drawTextToMesh')
		return { mesh, outline }
	}

	getCharGeo(char: string, style: ComponentStyle): CachedCharGeo {
		let font: MinecraftFont = this
		if (style.font) {
			const newFont = MinecraftFont.getById(style.font)
			if (newFont) font = newFont
		}

		const hash = createHash('sha256')
		hash.update(char)
		hash.update(';' + font.id)
		if (style.bold) hash.update('bold')
		if (style.italic) hash.update('italic')
		if (style.underlined) hash.update('underlined')
		if (style.strikethrough) hash.update('strikethrough')
		if (style.font) hash.update(';' + font.id)
		const digest = hash.digest('hex')

		const charData = font.getChar(char)
		const boldExtra = style.bold ? 1 : 0

		let charGeo = this.geoCache.get(digest)

		if (charGeo === undefined) {
			const canvas = document.createElement('canvas')
			if (charData.type === 'space') {
				canvas.width = charData.width
				canvas.height = 7
			} else {
				canvas.width = charData.bitmapUV.width
				canvas.height = charData.bitmapUV.height
			}

			const ctx = canvas.getContext('2d', { willReadFrequently: true })!
			ctx.imageSmoothingEnabled = false
			ctx.clearRect(0, 0, canvas.width, canvas.height)

			if (charData.type !== 'space') {
				ctx.drawImage(
					charData.atlas.image,
					charData.bitmapUV.x,
					charData.bitmapUV.y,
					charData.bitmapUV.width,
					charData.bitmapUV.height,
					0,
					0,
					canvas.width,
					canvas.height
				)
			}

			const data = ctx.getImageData(0, 0, canvas.width, canvas.height)

			const geo = new THREE.BufferGeometry()

			const mainGeoData = {
				vertices: [] as number[],
				indices: [] as number[],
			}

			const createQuad = (x: number, y: number, w: number, h: number) => {
				const vertIndex = mainGeoData.vertices.length / 3
				// prettier-ignore
				mainGeoData.vertices.push(
					x,     y,     0,
					x + w, y,     0,
					x + w, y + h, 0,
					x,     y + h, 0
				)
				mainGeoData.indices.push(
					vertIndex,
					vertIndex + 1,
					vertIndex + 2,
					vertIndex,
					vertIndex + 2,
					vertIndex + 3
				)
			}

			if (charData.type !== 'space') {
				// Generate a quad for each pixel in the character
				// This also attempts to make a single quad for each horizontal line of connected pixels
				for (let y = 0; y < canvas.height; y++) {
					const ascent = -y + charData.ascent
					let width = 0
					for (let x = 0; x < canvas.width; x++) {
						const i = (y * canvas.width + x) * 4
						const alpha = data.data[i + 3]
						if (alpha === 0) {
							if (width > 0) {
								createQuad(x - width, ascent, width + boldExtra, 1)
								width = 0
							}
							continue
						} else {
							width++
						}
					}
					if (width > 0) {
						createQuad(canvas.width - width, ascent, width + boldExtra, 1)
					}
				}
			}

			geo.setIndex(mainGeoData.indices)
			geo.setAttribute(
				'position',
				new THREE.BufferAttribute(new Float32Array(mainGeoData.vertices), 3)
			)
			if (style.italic) {
				geo.applyMatrix4(new THREE.Matrix4().makeShear(0, 0, 0.2, 0, 0, 0))
				geo.translate(-1, 0, 0)
			}

			mainGeoData.vertices = Array.from(geo.getAttribute('position').array)
			mainGeoData.indices = Array.from(geo.getIndex()!.array)

			if (style.underlined) {
				createQuad(-1, -1, canvas.width + 2, 1)
			}

			if (charData.type === 'space') {
				if (style.strikethrough) {
					const ascent = 7 / 2
					createQuad(-1, ascent, canvas.width + 2, 1)
				}
			} else {
				if (style.strikethrough) {
					const ascent = charData.ascent / 2
					createQuad(-1, ascent, canvas.width + 2, 1)
				}
			}

			geo.setIndex(mainGeoData.indices)
			geo.setAttribute(
				'position',
				new THREE.BufferAttribute(new Float32Array(mainGeoData.vertices), 3)
			)

			geo.attributes.position.needsUpdate = true
			charGeo = {
				geo,
				width: charData.width + boldExtra,
			}

			this.geoCache.set(digest, charGeo)
		}
		return charGeo
	}
}

let vanillaFont: MinecraftFont
let illagerFont: MinecraftFont
let standardGalacticAlphabetFont: MinecraftFont
function loadMinecraftFonts() {
	console.log('Loading Minecraft fonts...')
	vanillaFont = new MinecraftFont('minecraft:default', 'assets/minecraft/font/default.json')
	illagerFont = new MinecraftFont(
		'minecraft:illageralt',
		'assets/minecraft/font/illageralt.json',
		vanillaFont
	)
	standardGalacticAlphabetFont = new MinecraftFont(
		'minecraft:alt',
		'assets/minecraft/font/alt.json',
		vanillaFont
	)

	void Promise.all([
		vanillaFont.load(),
		illagerFont.load(),
		standardGalacticAlphabetFont.load(),
	]).then(() => {
		console.log('Minecraft fonts loaded!')
		requestAnimationFrame(() => EVENTS.MINECRAFT_FONTS_LOADED.publish())
	})
}

export async function getVanillaFont() {
	if (!vanillaFont) {
		await new Promise<void>(resolve => {
			EVENTS.MINECRAFT_FONTS_LOADED.subscribe(() => resolve())
		})
	}
	return vanillaFont.load()
}

EVENTS.MINECRAFT_ASSETS_LOADED.subscribe(() => {
	loadMinecraftFonts()
})

// events.SELECT_PROJECT.subscribe(() => {
// 	void getVanillaFont().then(async font => {
// 		await font.generateTextMesh({
// 			jsonText: new JsonText([
// 				'',
// 				{
// 					text: 'Sometimes ',
// 					italic: true,
// 				},
// 				'you ',
// 				{
// 					text: 'have',
// 					bold: true,
// 				},
// 				' to wear ',
// 				{
// 					text: 'stretchy',
// 					color: 'yellow',
// 				},
// 				' pants.\n',
// 				{
// 					text: "(It's for ",
// 				},
// 				{
// 					text: 'fun!',
// 					underlined: true,
// 					color: 'blue',
// 				},
// 				')',
// 			]),
// 			maxLineWidth: 100,
// 			backgroundColor: '#000000',
// 			backgroundAlpha: 0.25,
// 		})
// 	})
// })
