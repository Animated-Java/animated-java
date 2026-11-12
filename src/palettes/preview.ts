import { getPaletteImagePath, getTextureImagePath } from './atlas'
import { diskFileExists, getTargetVersion, readDiskFile, readPackAsset } from './host'
import { colorsFromPixels, pixelsFromColors, recolor, type PaletteColors } from './recolor'
import { getGeneratedSource, getGeneratedTextures, getPaletteSets, type PaletteSet } from './sets'
import type { IPaletteReference, IPaletteSetData, IPaletteStrip } from './types'

export interface IPixels {
	width: number
	height: number
	data: Uint8ClampedArray
}

/** Pack asset path -> decoded image. Cleared when the Preview resource packs change. */
const PACK_IMAGE_CACHE = new Map<string, Promise<IPixels | undefined>>()

/** Bumped whenever pack images may have changed, so redraws can't reuse stale pack images. */
let packImageGeneration = 0

export function clearPalettePreviewCache() {
	PACK_IMAGE_CACHE.clear()
	packImageGeneration++
}

function drawPixels(source: CanvasImageSource, width: number, height: number): IPixels {
	const canvas = document.createElement('canvas')
	canvas.width = width
	canvas.height = height
	const ctx = canvas.getContext('2d', { willReadFrequently: true })!
	ctx.drawImage(source, 0, 0)
	return { width, height, data: ctx.getImageData(0, 0, width, height).data }
}

async function decodePng(bytes: Uint8Array): Promise<IPixels | undefined> {
	try {
		const bitmap = await createImageBitmap(new Blob([bytes.slice()], { type: 'image/png' }))
		return drawPixels(bitmap, bitmap.width, bitmap.height)
	} catch {
		return undefined
	}
}

/**
 * Reads an image for a set. A reference set picked from an atlas file reads that file's pack first,
 * then the copies saved when it was picked (in case the pack moved). Everything else, and anything
 * missing there, comes from vanilla and the Preview packs.
 */
function readPackImage(
	assetPath: string,
	reference: IPaletteReference | undefined
): Promise<IPixels | undefined> {
	const packRoot = getPackRoot(reference)
	const cacheKey = `${reference?.file ?? ''}\n${packRoot ?? ''}\n${assetPath}`
	let cached = PACK_IMAGE_CACHE.get(cacheKey)
	if (!cached) {
		cached = (async () => {
			if (packRoot) {
				const bytes = await readDiskFile(PathModule.join(packRoot, assetPath))
				if (bytes) return decodePng(bytes)
			}
			const saved = reference?.images?.[assetPath]
			if (saved) return decodeDataURL(saved)
			const bytes = await readPackAsset(assetPath)
			return bytes ? decodePng(bytes) : undefined
		})()
		PACK_IMAGE_CACHE.set(cacheKey, cached)
	}
	return cached
}

/**
 * Copies the images a reference set uses out of its atlas file's pack, keyed by asset path, so its
 * previews still work if the pack moves. Images the pack doesn't have are left out.
 */
export async function savePackImages(
	reference: IPaletteReference,
	assetPaths: string[]
): Promise<Record<string, string>> {
	const packRoot = getPackRoot(reference)
	const images: Record<string, string> = {}
	if (!packRoot) return images
	for (const assetPath of new Set(assetPaths)) {
		const bytes = await readDiskFile(PathModule.join(packRoot, assetPath))
		if (!bytes) continue
		let binary = ''
		for (const byte of bytes) binary += String.fromCharCode(byte)
		images[assetPath] = 'data:image/png;base64,' + btoa(binary)
	}
	return images
}

/** The folder holding a reference set's atlas file's `assets/`, if it came from a file on disk. */
export function getPackRoot(reference: IPaletteReference | undefined): string | undefined {
	if (!reference?.file) return undefined
	let file = reference.file
	if (!diskFileExists(file) && reference.relative_file && Project?.save_path) {
		file = PathModule.resolve(PathModule.dirname(Project.save_path), reference.relative_file)
	}
	const parts = file.replace(/\\/g, '/').split('/')
	const assets = parts.lastIndexOf('assets')
	return assets > 0 ? parts.slice(0, assets).join('/') : undefined
}

function waitForImage(texture: Texture): Promise<void> {
	if (texture.img.complete && texture.img.naturalWidth) return Promise.resolve()
	return new Promise(resolve => {
		texture.img.addEventListener('load', () => resolve(), { once: true })
		texture.img.addEventListener('error', () => resolve(), { once: true })
	})
}

/**
 * A project texture's current pixels. Painting redraws the texture's image when a stroke ends, so
 * the image is always current once it has loaded.
 */
export async function getTexturePixels(texture: Texture): Promise<IPixels | undefined> {
	await waitForImage(texture)
	if (!texture.img.naturalWidth) return undefined
	return drawPixels(texture.img, texture.img.naturalWidth, texture.img.naturalHeight)
}

/** A base's pixels: a project texture, or a texture in a pack for reference sets. */
export async function getBasePixels(
	data: IPaletteSetData,
	base: string
): Promise<IPixels | undefined> {
	if (data.reference) return readPackImage(getTextureImagePath(base), data.reference)
	const texture = Texture.all.find(t => t.uuid === base)
	return texture ? getTexturePixels(texture) : undefined
}

/** A strip's colors, reading its image when it's a pack resource. Undefined if unreadable. */
export async function getStripColors(
	data: IPaletteSetData,
	strip: IPaletteStrip
): Promise<PaletteColors | undefined> {
	if (strip.colors) return strip.colors
	if (!strip.id) return undefined
	const image = await readPackImage(
		getPaletteImagePath(strip.id, getTargetVersion()),
		data.reference
	)
	return image ? colorsFromPixels(image.data) : undefined
}

/** Decodes an image file the user imported, given as a data URL. */
export async function decodeDataURL(dataURL: string): Promise<IPixels | undefined> {
	try {
		const blob = await (await fetch(dataURL)).blob()
		return decodePng(new Uint8Array(await blob.arrayBuffer()))
	} catch {
		return undefined
	}
}

/** Minecraft's missing texture, at `width` x `height`. */
function missingPixels(width: number, height: number): IPixels {
	const data = new Uint8ClampedArray(width * height * 4)
	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			const magenta = x < width / 2 !== y < height / 2
			data.set(magenta ? [248, 0, 248, 255] : [0, 0, 0, 255], (y * width + x) * 4)
		}
	}
	return { width, height, data }
}

/**
 * Renders one recolor. A palette that doesn't fit its key shows the missing texture, since
 * Minecraft skips the sprite.
 */
export function renderRecolor(base: IPixels, key: PaletteColors, palette: PaletteColors): IPixels {
	try {
		return { ...base, data: recolor(base.data, key, palette) }
	} catch {
		return missingPixels(base.width, base.height)
	}
}

export function pixelsToDataURL(pixels: IPixels): string {
	const canvas = document.createElement('canvas')
	canvas.width = pixels.width
	canvas.height = pixels.height
	canvas
		.getContext('2d')!
		.putImageData(
			new ImageData(new Uint8ClampedArray(pixels.data), pixels.width, pixels.height),
			0,
			0
		)
	return canvas.toDataURL()
}

/** Encodes strip colors as a one-row PNG, the shape vanilla's palettes use. */
export function encodeColorsAsPng(colors: PaletteColors): Uint8Array {
	const dataURL = pixelsToDataURL({
		width: colors.length,
		height: 1,
		data: pixelsFromColors(colors),
	})
	const binary = atob(dataURL.slice(dataURL.indexOf(',') + 1))
	return Uint8Array.from(binary, char => char.charCodeAt(0))
}

function setTextureImage(texture: Texture, dataURL: string) {
	texture.internal = true
	texture.saved = true
	if (texture.source !== dataURL) texture.updateSource(dataURL)
}

/** Generated texture -> the inputs it was last drawn from, to skip unchanged redraws. */
const DRAWN_FROM = new WeakMap<Texture, string>()

/**
 * What a base's image is drawn from: a project texture's image source, which painting replaces,
 * or a pack path for reference sets.
 */
function getBaseSignature(data: IPaletteSetData, base: string): string {
	if (data.reference) {
		return `${packImageGeneration}\n${data.reference.file ?? ''}\n${getTextureImagePath(base)}`
	}
	return Texture.all.find(t => t.uuid === base)?.img.src ?? ''
}

/** Draws `texture` from `inputs`, unless it was last drawn from the same inputs. */
async function drawIfChanged(texture: Texture, inputs: string, draw: () => Promise<IPixels>) {
	if (DRAWN_FROM.get(texture) === inputs && texture.source) return
	setTextureImage(texture, pixelsToDataURL(await draw()))
	DRAWN_FROM.set(texture, inputs)
}

/** Redraws every generated texture of `set` whose inputs changed. */
async function regenerateSet(set: PaletteSet) {
	const data = set.palette_set
	const key = await getStripColors(data, data.key)
	for (const texture of getGeneratedTextures(set)) {
		const source = getGeneratedSource(texture)
		if (!source) continue
		const palette = await getStripColors(data, source.permutation.strip)
		const inputs = [
			getBaseSignature(data, source.base),
			JSON.stringify(key),
			JSON.stringify(palette),
		].join('\n')
		await drawIfChanged(texture, inputs, async () => {
			const base = await getBasePixels(data, source.base)
			if (!base) return missingPixels(16, 16)
			return key && palette ? renderRecolor(base, key, palette) : base
		})
	}
}

/**
 * Draws a project set's recolors onto their canvases from `data` and its bases' canvases, without
 * changing their images, so unsaved edits show on the model. Only `base`'s recolors, if given.
 */
export async function drawRecolorCanvases(
	set: PaletteSet,
	data: IPaletteSetData = set.palette_set,
	base?: Texture
) {
	if (data.reference) return
	const key = await getStripColors(data, data.key)
	if (!key) return
	const read = new Map<Texture, IPixels>()
	for (const texture of getGeneratedTextures(set)) {
		const { base: baseUuid, permutation: permutationUuid } = texture.palette_generated
		if (base && baseUuid !== base.uuid) continue
		const source = base ?? Texture.all.find(t => t.uuid === baseUuid)
		const { width, height } = source?.canvas ?? {}
		if (!source || !width || !height) continue
		if (texture.canvas.width !== width || texture.canvas.height !== height) continue
		const permutation = data.permutations.find(p => p.uuid === permutationUuid)
		const palette = permutation && (await getStripColors(data, permutation.strip))
		if (!palette) continue
		let pixels = read.get(source)
		if (!pixels) {
			pixels = { width, height, data: source.ctx.getImageData(0, 0, width, height).data }
			read.set(source, pixels)
		}
		const recolored = renderRecolor(pixels, key, palette)
		const image = new ImageData(new Uint8ClampedArray(recolored.data), width, height)
		texture.ctx.putImageData(image, 0, 0)
		// Blockbench's texture materials draw from the texture's canvas through `map`.
		const material = texture.getOwnMaterial() as THREE.ShaderMaterial & {
			map: THREE.Texture
		}
		material.map.needsUpdate = true
	}
}

/**
 * Redraws `base`'s recolors from its canvas, which painting changes before its image, so a stroke
 * shows on the recolors while it's being painted. The usual redraw still runs once it ends.
 */
export async function redrawRecolorsOf(base: Texture) {
	for (const set of getPaletteSets()) {
		if (set.palette_set.bases.includes(base.uuid)) {
			await drawRecolorCanvases(set, set.palette_set, base)
		}
	}
}

let pending: Promise<void> | undefined
let queued = false

/**
 * Redraws every set's textures. Calls made while a redraw runs collapse into one more redraw once
 * it finishes, so the result always reflects the latest edits.
 */
export function regenerateAllSets(): Promise<void> {
	if (pending) {
		queued = true
		return pending
	}
	pending = (async () => {
		do {
			queued = false
			for (const set of getPaletteSets()) await regenerateSet(set)
		} while (queued)
	})()
	const done = pending.then(() => {
		pending = undefined
		Canvas.updateAllFaces()
	})
	return done
}
