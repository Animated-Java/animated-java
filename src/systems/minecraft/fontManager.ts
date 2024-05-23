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
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils'

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

const MAX_CANVAS_WIDTH = 16_384
const MAX_CANVAS_HEIGHT = 16_384

function hexToRGB(hex: string) {
	return {
		r: parseInt(hex.substring(1, 3), 16) / 255,
		g: parseInt(hex.substring(3, 5), 16) / 255,
		b: parseInt(hex.substring(5, 7), 16) / 255,
	}
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
		// console.log('Font provider JSON:', providerJSON)
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
		// console.log('SpaceFontProvider:', this.advances)
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
	public chars: string[] = []

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
		this.chars = providerJSON.chars
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
		// console.log('BitmapFontProvider loaded:', this)
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
			// console.log('Char width:', char, width)

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
	private charCanvasCache = new Map<string, HTMLCanvasElement>()

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
			// if (this.fallback) {
			// 	console.warn(
			// 		`Character '${char}' not found in font '${this.id}', falling back to '${this.fallback.id}'`
			// 	)
			// 	const charData = this.fallback.getChar(char)
			// 	if (charData) {
			// 		this.charCache.set(char, charData)
			// 	}
			// 	return charData
			// }
		}
		return this.charCache.get(char)
	}

	getTextWidth(text: string, span: IStyleSpan) {
		let width = 0
		const boldExtra = span.style.bold ? 1 : 0
		for (const char of text) {
			if (char === '\n') return Math.max(width, 0)
			const charData = this.getChar(char)
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
			if (span.style.font) {
				const newFont = MinecraftFont.getById(span.style.font as string)
				if (newFont) font = newFont
			}
			const text = word.text.slice(span.start, span.end)
			const textWidth = font.getTextWidth(text, span)
			width += textWidth
		}
		return Math.max(width, 0)
	}

	drawCharToCanvas(
		ctx: CanvasRenderingContext2D,
		char: string,
		style: StyleRecord,
		cursor: { x: number; y: number },
		scale: number
	) {
		// eslint-disable-next-line @typescript-eslint/no-this-alias
		let font: MinecraftFont = this
		if (style.font) {
			const newFont = MinecraftFont.getById(style.font as string)
			if (newFont) font = newFont
		}
		const charData = font.getChar(char)
		if (!charData) return

		let color = '#ffffff'
		if (typeof style.color === 'string') {
			color = style.color.startsWith('#') ? style.color : COLOR_MAP[style.color] || color
		}
		const r = parseInt(color.substring(1, 3), 16)
		const g = parseInt(color.substring(3, 5), 16)
		const b = parseInt(color.substring(5, 7), 16)

		if (charData.type === 'bitmap') {
			// Create a canvas for the character to allow us to style it before drawing it to the actual canvas

			const hash = createHash('sha256')
			hash.update(char)
			hash.update(';' + scale.toString())
			hash.update(';' + color)
			if (style.bold) hash.update(';bold')
			if (style.italic) hash.update(';italic')
			// if (style.underlined) hash.update('underlined')
			// if (style.strikethrough) hash.update('strikethrough')
			// if (style.obfuscated) hash.update('obfuscated')
			const digest = hash.digest('hex')

			let charCanvas = this.charCanvasCache.get(digest)
			if (!charCanvas) {
				charCanvas = document.createElement('canvas')
				this.charCanvasCache.set(digest, charCanvas)

				const charCtx = charCanvas.getContext('2d')!

				charCanvas.width = charData.width * 2 * scale
				charCanvas.height = charData.pixelUV[3] * scale
				charCtx.imageSmoothingEnabled = false
				charCtx.clearRect(0, 0, charCanvas.width, charCanvas.height)

				if (style.italic) {
					charCtx.setTransform(1, 0, -0.25, 1, scale / 1.5, 0)
				}
				charCtx.drawImage(
					charData.atlas.image as HTMLImageElement,
					charData.pixelUV[0],
					charData.pixelUV[1],
					charData.pixelUV[2],
					charData.pixelUV[3],
					scale,
					0,
					charData.pixelUV[2] * scale,
					charData.pixelUV[3] * scale
				)
				if (style.bold) {
					charCtx.drawImage(
						charData.atlas.image as HTMLImageElement,
						charData.pixelUV[0],
						charData.pixelUV[1],
						charData.pixelUV[2],
						charData.pixelUV[3],
						scale * 2,
						0,
						charData.pixelUV[2] * scale,
						charData.pixelUV[3] * scale
					)
				}

				// Colorize the character
				const imageData = charCtx.getImageData(0, 0, charCanvas.width, charCanvas.height)
				const data = imageData.data

				for (let i = 0; i < data.length; i += 4) {
					if (data[i + 3] > 0) {
						data[i] = r // Red
						data[i + 1] = g // Green
						data[i + 2] = b // Blue
						data[i + 3] = 255 // Alpha
					}
				}
				charCtx.putImageData(imageData, 0, 0)
			}

			// Draw the character to the actual canvas
			ctx.drawImage(
				charCanvas,
				(cursor.x - 1) * scale,
				cursor.y * scale,
				charCanvas.width,
				charCanvas.height
			)
		}

		if (style.underlined) {
			ctx.fillStyle = color
			ctx.fillRect(
				(cursor.x - 1) * scale,
				(cursor.y + 8) * scale,
				style.bold ? (charData.width + 2) * scale : (charData.width + 1) * scale,
				scale
			)
		}

		if (style.strikethrough) {
			ctx.fillStyle = color
			ctx.fillRect(
				(cursor.x - 1) * scale,
				(cursor.y + 7 / 2) * scale,
				style.bold ? (charData.width + 2) * scale : (charData.width + 1) * scale,
				scale
			)
		}

		if (style.bold) cursor.x += 1
		cursor.x += charData.width
	}

	async drawJsonTextToCanvas(options: {
		ctx: CanvasRenderingContext2D
		jsonText: JsonText
		x: number
		y: number
		lineWidth: number
		scale: number
		backgroundColor: string
		backgroundAlpha: number
	}) {
		const {
			ctx,
			jsonText,
			x,
			y,
			lineWidth,
			scale: originalScale,
			backgroundColor,
			backgroundAlpha,
		} = options
		let scale = options.scale
		const words = getComponentWords(jsonText)
		const { lines, canvasWidth } = await computeTextWrapping(words, lineWidth)
		// // Debug output
		// const wordWidths = words.map(word => this.getWordWidth(word))
		// for (const word of words) {
		// 	console.log(words.indexOf(word), word.text, wordWidths[words.indexOf(word)])
		// 	for (const span of word.styles) {
		// 		console.log(
		// 			`'${word.text.slice(span.start, span.end)}' ${span.start}-${span.end} = `,
		// 			span.style
		// 		)
		// 	}
		// }
		// console.log('Lines:', lines)
		// for (const line of lines) {
		// 	console.log('Line', lines.indexOf(line), line.width)
		// 	for (const word of line.words) {
		// 		console.log(
		// 			'Word',
		// 			line.words.indexOf(word),
		// 			word.text,
		// 			word.styles.map(span => span.style),
		// 			word.styles.map(
		// 				span => `${span.start}-${span.end} ${word.text.slice(span.start, span.end)}`
		// 			)
		// 		)
		// 	}
		// }

		console.time('drawTextToCanvas')

		while (
			(canvasWidth + 1) * scale > MAX_CANVAS_WIDTH ||
			lines.length * 11 * scale > MAX_CANVAS_HEIGHT
		) {
			console.warn(
				`Text Canvas too large (${(canvasWidth + 1) * scale} x ${
					lines.length * 11 * scale
				}) , scaling down...`,
				scale,
				'->',
				scale / 2
			)
			scale /= 2
			if (scale < 1) {
				console.error('Text too large to render')
				await this.drawJsonTextToCanvas({
					ctx,
					jsonText: new JsonText(`Text too large to render :(`),
					x,
					y,
					lineWidth,
					scale: originalScale,
					backgroundColor,
					backgroundAlpha,
				})
				return
			}
		}

		ctx.canvas.width = (canvasWidth + 1) * scale
		ctx.canvas.height = lines.length * 11 * scale
		ctx.imageSmoothingEnabled = false

		const rgb = hexToRGB(backgroundColor)
		ctx.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${backgroundAlpha})`
		ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height)

		const cursor = { x, y }
		for (const line of lines) {
			cursor.x = x + (canvasWidth - line.width) / 2
			for (const word of line.words) {
				for (const span of word.styles) {
					const text = word.text.slice(span.start, span.end)
					for (const char of text) {
						this.drawCharToCanvas(ctx, char, span.style, cursor, scale)
					}
				}
			}
			cursor.y += 11
		}
		console.timeEnd('drawTextToCanvas')
	}

	characterMeshCache = new Map<string, ICachedCharMesh>()

	async generateTextMesh({
		jsonText,
		maxLineWidth,
		backgroundColor,
		backgroundAlpha,
	}: {
		jsonText: JsonText
		maxLineWidth: number
		backgroundColor: string
		backgroundAlpha: number
	}): Promise<{ mesh: THREE.Mesh; outline: THREE.LineSegments }> {
		// console.log(
		// 	'Drawing text to mesh...',
		// 	jsonText,
		// 	maxLineWidth,
		// 	backgroundColor,
		// 	backgroundAlpha
		// )
		console.time('drawTextToMesh')
		const mesh = new THREE.Mesh()

		const words = getComponentWords(jsonText)
		const { lines, canvasWidth } = await computeTextWrapping(words, maxLineWidth)
		const width = canvasWidth + 1
		const height = lines.length * 10 + 1
		// // Debug output
		// const wordWidths = words.map(word => this.getWordWidth(word))
		// for (const word of words) {
		// 	console.log(words.indexOf(word), word.text, wordWidths[words.indexOf(word)])
		// 	for (const span of word.styles) {
		// 		console.log(
		// 			`'${word.text.slice(span.start, span.end)}' ${span.start}-${span.end} = `,
		// 			span.style
		// 		)
		// 	}
		// }
		// console.log('Lines:', lines)
		// for (const line of lines) {
		// 	console.log('Line', lines.indexOf(line), line.width)
		// 	for (const word of line.words) {
		// 		console.log(
		// 			'Word',
		// 			line.words.indexOf(word),
		// 			`'${word.text}'`,
		// 			word.styles.map(span => span.style),
		// 			word.styles.map(
		// 				span =>
		// 					`${span.start}-${span.end} '${word.text.slice(span.start, span.end)}'`
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
			cursor.x = -width / 2 + Math.ceil((width - line.width) / 2)
			for (const word of line.words) {
				for (const span of word.styles) {
					const text = word.text.slice(span.start, span.end)
					for (const char of text) {
						const charMesh = this.generateCharMesh(char, span.style)
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

		// @ts-expect-error
		const charGeo = BufferGeometryUtils.mergeBufferGeometries(geos)
		if (charGeo) {
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

	generateCharMesh(char: string, style: StyleRecord): ICachedCharMesh | undefined {
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
		const boldExtra = style.bold ? 1 : 0

		if (charData.type === 'bitmap') {
			const hash = createHash('sha256')
			hash.update(char)
			hash.update(color.getHexString())
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
		events.MINECRAFT_FONTS_LOADED.dispatch()
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
