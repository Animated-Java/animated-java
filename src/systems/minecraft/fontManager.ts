import { events } from '../../util/events'
import { COLOR_MAP, JsonText } from './jsonText'
import { getPathFromResourceLocation } from '../../util/minecraftUtil'
import * as assets from './assetManager'
import MissingCharacter from '../../assets/missing_character.png'
import {
	IComponentWord,
	IStyleSpan,
	getComponentWords,
	computeTextWrapping,
	StyleRecord,
} from './textWrapping'
import { createHash } from 'crypto'
import { UnicodeString } from '../../util/unicodeString'
import { type Alignment } from '../../outliner/textDisplay'
import { mergeGeometries } from '../../util/bufferGeometryUtils'

interface IFontProviderBitmap {
	type: 'bitmap'
	file: string
	height?: number
	// FIXME This isn't actually used for anything yet...
	ascent: number
	chars: string[]
}

interface IFontProviderReference {
	type: 'reference'
	id: string
	filter?: {
		uniform?: boolean
	}
}

interface IFontProviderSpace {
	type: 'space'
	advances: Record<string, number>
}

type IFontProvider = IFontProviderBitmap | IFontProviderReference | IFontProviderSpace

interface IFont {
	providers: IFontProvider[]
}

interface ICachedBitmapChar {
	type: 'bitmap'
	ascent: number
	width: number
	atlas: THREE.Texture
	pixelUV: [number, number, number, number]
	uv: [number, number, number, number]
}

interface ICachedSpaceChar {
	type: 'space'
	width: number
}

type ICachedChar = ICachedBitmapChar | ICachedSpaceChar

type ICachedCharMesh = {
	geo?: THREE.BufferGeometry
	width: number
}

class FontProvider {
	public type: 'bitmap' | 'reference' | 'space'
	public loaded = false

	constructor(providerJSON: IFontProvider) {
		this.type = providerJSON.type
	}

	// eslint-disable-next-line @typescript-eslint/require-await
	async load() {
		if (this.loaded) return this
		this.loaded = true
		return this
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	getChar(_char: string, top = true): ICachedChar | undefined {
		return undefined
	}

	static fromAssetPath(assetPath: string) {
		if (!assetPath.endsWith('.json')) assetPath += '.json'
		const providerJSON = assets.getJSONAsset(assetPath) as IFontProvider
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

	constructor(providerJSON: IFontProviderReference) {
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

	getChar(char: string, top = true) {
		return this.reference.getChar(char, top)
	}
}

class SpaceFontProvider extends FontProvider {
	public advances: Record<string, number>

	constructor(providerJSON: IFontProviderSpace) {
		super(providerJSON)
		this.advances = providerJSON.advances
	}

	getChar(char: string): ICachedChar | undefined {
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

	private charCache = new Map<string, ICachedChar>()

	constructor(providerJSON: IFontProviderBitmap) {
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
		const ctx = this.canvas.getContext('2d')!
		ctx.drawImage(this.atlas.image as HTMLImageElement, 0, 0)
		this.loaded = true
		return this
	}

	private getCharIndex(char: string): [number, number] {
		for (const row of this.chars) {
			if (row.includes(char)) {
				return [this.chars.indexOf(row), row.indexOf(char)]
			}
		}
		return [-1, -1]
	}

	getChar(char: string) {
		if (!this.charCache.has(char)) {
			const charPos = this.getCharIndex(char)
			if (charPos[0] === -1) return
			// Figure out how wide the character is by checking for the last non-transparent pixel
			const startX = charPos[1] * this.charWidth
			const startY = charPos[0] * this.charHeight
			const data = this.canvas
				.getContext('2d')!
				.getImageData(startX, startY, this.charWidth, this.charHeight)

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

			// eslint-disable-next-line @typescript-eslint/no-this-alias
			const scope = this
			this.charCache.set(char, {
				type: 'bitmap',
				ascent: this.ascent,
				width: width + 1, // Add 1 pixel of spacing between characters
				get atlas() {
					return scope.atlas
				},
				pixelUV: [startX, startY, width, this.charHeight],
				uv: [
					startX / scope.atlas.image.width,
					startY / scope.atlas.image.height,
					width / scope.atlas.image.width,
					this.charHeight / scope.atlas.image.height,
				],
			})
		}
		return this.charCache.get(char)!
	}
}

export class MinecraftFont {
	static all: MinecraftFont[] = []
	static missingCharacterAtlas = new THREE.TextureLoader().load(MissingCharacter)

	public id: string
	public providers: FontProvider[] = []
	public fallback: MinecraftFont | undefined

	private charCache = new Map<string, ICachedChar>()
	private loaded = false
	private characterMeshCache = new Map<string, ICachedCharMesh>()

	constructor(id: string, assetPath: string, fallback?: MinecraftFont) {
		this.id = id
		this.fallback = fallback
		const fontJSON = assets.getJSONAsset(assetPath) as IFont

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
		await Promise.all(this.providers.map(provider => provider.load())).then(() => {
			// // Cache commonly used characters
			// for (const char of 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}\\|;:\'",.<>/?`~ ') {
			// 	this.getChar(char)
			// }
		})
		this.loaded = true
		return this
	}

	/**
	 * @returns The character data for the given character, or undefined if the character is not found.
	 */
	getChar(char: string, top = true): ICachedChar | undefined {
		if (!this.charCache.has(char)) {
			for (const provider of this.providers) {
				const data = provider.getChar(char, false)
				if (data) {
					this.charCache.set(char, data)
					return data
				}
			}
			if (top) {
				return {
					type: 'bitmap',
					ascent: 7,
					width: 6,
					atlas: MinecraftFont.missingCharacterAtlas,
					pixelUV: [0, 0, 8, 8],
					uv: [0, 0, (1 / 8) * 6, 1],
				}
			}
		}
		return this.charCache.get(char)
	}

	getTextWidth(text: UnicodeString, span: IStyleSpan) {
		let width = 0
		const boldExtra = span.style.bold ? 1 : 0
		// eslint-disable-next-line @typescript-eslint/no-this-alias
		let font: MinecraftFont = this
		if (span.style.font && span.style.font !== this.id) {
			const newFont = MinecraftFont.getById(span.style.font as string)
			if (newFont) font = newFont
		}
		for (const char of text) {
			if (char === '\n') break
			const charData = font.getChar(char)
			// TODO: Handle missing characters better
			if (!charData) {
				console.warn(`Missing character: '${char}'`)
				continue
			}

			width += charData.width + boldExtra
		}
		return Math.max(width, 0)
	}

	getWordWidth(word: IComponentWord) {
		let width = 0
		// eslint-disable-next-line @typescript-eslint/no-this-alias
		let font: MinecraftFont = this
		for (const span of word.styles) {
			if (span.style.font && span.style.font !== this.id) {
				const newFont = MinecraftFont.getById(span.style.font as string)
				if (newFont) font = newFont
			}
			const text = word.text.slice(span.start, span.end)
			const textWidth = font.getTextWidth(text, span)
			width += textWidth
		}
		return Math.max(width, 0)
	}

	async generateTextMesh({
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
		shadow?: boolean
		alignment?: Alignment
	}): Promise<{ mesh: THREE.Mesh; outline: THREE.LineSegments }> {
		console.time('drawTextToMesh')
		const mesh = new THREE.Mesh()

		const words = getComponentWords(jsonText)
		const { lines, backgroundWidth } = await computeTextWrapping(words, maxLineWidth)
		const width = backgroundWidth + 1
		const height = lines.length * 10 + 1
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

		const geos: THREE.BufferGeometry[] = []
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
					const text = word.text.slice(span.start, span.end)
					for (const char of text) {
						const charMesh = this.generateCharMesh(char, span.style, shadow)
						if (!charMesh) continue
						if (charMesh.geo) {
							const clone = charMesh.geo.clone()
							clone.translate(cursor.x, cursor.y, 0)
							geos.push(clone)
						}
						cursor.x += charMesh.width
					}
				}
			}
			cursor.y -= 10
		}

		let charGeo: THREE.BufferGeometry | undefined
		if (geos.length > 0) {
			charGeo = mergeGeometries(geos)!
			const charMesh = new THREE.Mesh(
				charGeo,
				new THREE.MeshBasicMaterial({ vertexColors: true })
			)
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

	generateCharMesh(
		char: string,
		style: StyleRecord,
		shadow?: boolean
	): ICachedCharMesh | undefined {
		// eslint-disable-next-line @typescript-eslint/no-this-alias
		let font: MinecraftFont = this
		if (style.font) {
			const newFont = MinecraftFont.getById(style.font as string)
			if (newFont) font = newFont
		}
		const charData = font.getChar(char)
		if (!charData) {
			// Technically this should never happen, but just in case...
			console.error('Unknown character:', char)
			return
		}

		let color = new THREE.Color('#ffffff')
		if (typeof style.color === 'string') {
			color =
				style.color.startsWith('#') && style.color.length === 7
					? new THREE.Color(style.color)
					: new THREE.Color(COLOR_MAP[style.color]) || color
		}
		const shadowColor = color.clone().multiplyScalar(0.25)

		const boldExtra = style.bold ? 1 : 0

		if (charData.type === 'bitmap') {
			const hash = createHash('sha256')
			hash.update(char)
			hash.update(color.getHexString())
			if (shadow) hash.update('shadow')
			if (style.bold) hash.update('bold')
			if (style.italic) hash.update('italic')
			if (style.underlined) hash.update('underlined')
			if (style.strikethrough) hash.update('strikethrough')
			if (style.font) hash.update(';' + font.id)
			// if (style.obfuscated) hash.update('obfuscated')
			const digest = hash.digest('hex')

			let charMesh = this.characterMeshCache.get(digest)

			if (charMesh === undefined) {
				// If no mesh is found, create a new one
				const canvas = document.createElement('canvas')
				const ctx = canvas.getContext('2d', { willReadFrequently: true })!
				canvas.width = charData.pixelUV[2]
				canvas.height = charData.pixelUV[3]
				ctx.imageSmoothingEnabled = false
				ctx.clearRect(0, 0, canvas.width, canvas.height)

				ctx.drawImage(
					charData.atlas.image as HTMLImageElement,
					charData.pixelUV[0],
					charData.pixelUV[1],
					charData.pixelUV[2],
					charData.pixelUV[3],
					0,
					0,
					canvas.width,
					canvas.height
				)
				const data = ctx.getImageData(0, 0, canvas.width, canvas.height)

				const geo = new THREE.BufferGeometry()
				let colors: number[] = []
				let vertices: number[] = []
				let indices: number[] = []

				const createQuad = (x: number, y: number, w: number, h: number) => {
					const vertIndex = vertices.length / 3
					// prettier-ignore
					vertices.push(
						x, y, 0,
						x + w, y, 0,
						x + w, y + h, 0,
						x, y + h, 0
					)
					indices.push(
						vertIndex,
						vertIndex + 1,
						vertIndex + 2,
						vertIndex,
						vertIndex + 2,
						vertIndex + 3
					)
					// prettier-ignore
					colors.push(
						color.r, color.g, color.b,
						color.r, color.g, color.b,
						color.r, color.g, color.b,
						color.r, color.g, color.b
					)
					if (shadow) {
						const shadowVertIndex = vertices.length / 3
						x += 1
						y -= 1
						const z = -0.01
						// prettier-ignore
						vertices.push(
							x, y, z,
							x + w, y, z,
							x + w, y + h, z,
							x, y + h, z
						)
						indices.push(
							shadowVertIndex,
							shadowVertIndex + 1,
							shadowVertIndex + 2,
							shadowVertIndex,
							shadowVertIndex + 2,
							shadowVertIndex + 3
						)
						// prettier-ignore
						colors.push(
							shadowColor.r, shadowColor.g, shadowColor.b,
							shadowColor.r, shadowColor.g, shadowColor.b,
							shadowColor.r, shadowColor.g, shadowColor.b,
							shadowColor.r, shadowColor.g, shadowColor.b
						)
					}
				}

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

				geo.setIndex(indices)
				geo.setAttribute(
					'position',
					new THREE.BufferAttribute(new Float32Array(vertices), 3)
				)
				geo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(colors), 3))

				if (style.italic) {
					geo.applyMatrix4(new THREE.Matrix4().makeShear(0, 0, 0.2, 0, 0, 0))
					geo.translate(-1, 0, 0)
				}

				vertices = Array.from(geo.getAttribute('position').array)
				colors = Array.from(geo.getAttribute('color').array)
				indices = Array.from(geo.getIndex()!.array)

				if (style.underlined) {
					createQuad(-1, -1, canvas.width + 2, 1)
				}

				if (style.strikethrough) {
					const ascent = charData.ascent / 2 + 1
					createQuad(-1, ascent, canvas.width + 2, 1)
				}

				geo.setIndex(indices)
				geo.setAttribute(
					'position',
					new THREE.BufferAttribute(new Float32Array(vertices), 3)
				)
				geo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(colors), 3))

				geo.attributes.position.needsUpdate = true
				geo.attributes.color.needsUpdate = true
				charMesh = {
					geo,
					width: charData.width + boldExtra,
				}

				this.characterMeshCache.set(digest, charMesh)
			}
			return charMesh
		} else {
			return {
				width: charData.width,
			}
		}
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
		requestAnimationFrame(() => events.MINECRAFT_FONTS_LOADED.dispatch())
	})
}

export async function getVanillaFont() {
	if (!vanillaFont) {
		await new Promise<void>(resolve => {
			events.MINECRAFT_FONTS_LOADED.subscribe(() => resolve())
		})
	}
	return vanillaFont.load()
}

events.MINECRAFT_ASSETS_LOADED.subscribe(() => {
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
