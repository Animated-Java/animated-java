import { getBlueprintThumbnail, getThumbnailPath } from '../../collections'
import { getFsModule } from '../../constants'

/** Blockbench's recent-projects thumbnail size. */
const WIDTH = 270
const HEIGHT = 150
const GAP = 4
const MAX_TILES = 4
const ICON_FONT = '40px "Material Icons"'

interface Tile {
	x: number
	y: number
	width: number
	height: number
}

/** One tile per member: full size for one, side by side for two, a 2×2 grid for more. */
function layoutTiles(count: number): Tile[] {
	const columns = count >= 2 ? 2 : 1
	const rows = count >= 3 ? 2 : 1
	const width = (WIDTH - GAP * (columns + 1)) / columns
	const height = (HEIGHT - GAP * (rows + 1)) / rows
	return Array.from({ length: Math.max(1, Math.min(count, MAX_TILES)) }, (_, i) => ({
		x: GAP + (i % columns) * (width + GAP),
		y: GAP + Math.floor(i / columns) * (height + GAP),
		width,
		height,
	}))
}

function loadImage(path: string) {
	return new Promise<HTMLImageElement | undefined>(resolve => {
		const image = new Image()
		image.onload = () => resolve(image)
		image.onerror = () => resolve(undefined)
		// Thumbnails are rewritten in place, so skip the image cache.
		image.src = `${path}?${Date.now()}`
	})
}

/** Draws `image` to fill `tile`, cropping whatever overflows, like `object-fit: cover`. */
function drawCover(ctx: CanvasRenderingContext2D, image: HTMLImageElement, tile: Tile) {
	const scale = Math.max(tile.width / image.width, tile.height / image.height)
	const width = tile.width / scale
	const height = tile.height / scale
	ctx.drawImage(
		image,
		(image.width - width) / 2,
		(image.height - height) / 2,
		width,
		height,
		tile.x,
		tile.y,
		tile.width,
		tile.height
	)
}

function drawText(ctx: CanvasRenderingContext2D, text: string, font: string, tile: Tile) {
	ctx.font = font
	ctx.textAlign = 'center'
	ctx.textBaseline = 'middle'
	ctx.fillText(text, tile.x + tile.width / 2, tile.y + tile.height / 2)
}

async function renderThumbnail(members: string[]) {
	const style = getComputedStyle(document.body)
	const canvas = document.createElement('canvas')
	canvas.width = WIDTH
	canvas.height = HEIGHT
	const ctx = canvas.getContext('2d')!
	await document.fonts.load(ICON_FONT)

	const tiles = layoutTiles(members.length)
	const overflow = members.length > MAX_TILES ? members.length - (MAX_TILES - 1) : 0
	for (const [index, tile] of tiles.entries()) {
		ctx.save()
		ctx.beginPath()
		ctx.roundRect(tile.x, tile.y, tile.width, tile.height, 4)
		ctx.clip()
		ctx.fillStyle = style.getPropertyValue('--color-back')
		ctx.fillRect(tile.x, tile.y, tile.width, tile.height)
		ctx.fillStyle = style.getPropertyValue('--color-subtle_text')

		const member = members.at(index)
		if (overflow && index === MAX_TILES - 1) {
			drawText(ctx, `+${overflow}`, `28px ${style.fontFamily}`, tile)
		} else if (!member) {
			drawText(ctx, 'collections_bookmark', ICON_FONT, tile)
		} else if (!getFsModule().existsSync(member)) {
			drawText(ctx, 'warning', ICON_FONT, tile)
		} else {
			const thumbnail = getBlueprintThumbnail(member)
			const image = thumbnail && (await loadImage(thumbnail))
			if (image) drawCover(ctx, image, tile)
			else drawText(ctx, 'view_in_ar', ICON_FONT, tile)
		}
		ctx.restore()
	}
	return canvas
}

/**
 * Draws the collection's recent-projects thumbnail as a collage of its first members' own
 * thumbnails, and shows it on the start screen.
 * @param recentPath The path the collection is listed under in recent projects.
 * @param members Absolute member paths, in export order.
 */
export async function updateCollectionThumbnail(recentPath: string, members: string[]) {
	if (!isApp) return
	try {
		const canvas = await renderThumbnail(members)
		const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve))
		if (!blob) return
		const path = getThumbnailPath(recentPath)
		const fs = getFsModule()
		fs.mkdirSync(PathModule.dirname(path), { recursive: true })
		fs.writeFileSync(path, new Uint8Array(await blob.arrayBuffer()))
		StartScreen.updateThumbnails([recentPath])
	} catch (e) {
		// A missing thumbnail shouldn't get in the way of opening or saving.
		console.warn(`Couldn't update the thumbnail of '${recentPath}':`, e)
	}
}
