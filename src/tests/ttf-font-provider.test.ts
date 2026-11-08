import { describe, expect, it } from '@jest/globals'
import { blockbench } from '@snavesutit/jestbench'
import * as path from 'node:path'

const BLUEPRINT_FORMAT_ID = 'animated-java:format/blueprint'
const TTF_FONT_PACK = path.resolve(process.cwd(), 'test-packs/ttf-font-pack')

interface GlyphSummary {
	type: 'bitmap' | 'space'
	width: number
	ascent?: number
	bearingX?: number
	scale?: number
	/** Drawn from a ttf provider (its glyph atlas pages are DataTextures). */
	fromTtf: boolean
}

interface FontSummary {
	providers: string[]
	glyphs: Record<string, GlyphSummary>
}

/** Opens a Blueprint with the ttf fixture pack as its preview resource pack.
 * jestbench closes projects between tests, so each test calls this first. */
async function openProjectWithPack() {
	await blockbench.evaluate(
		async (args: { formatId: string; packPath: string }) => {
			const g = globalThis as any
			g.newProject(g.Formats[args.formatId])
			// Let the project-select handler's own preview pack apply settle first,
			// so it can't clear the font cache mid-test.
			await new Promise(resolve => setTimeout(resolve, 250))
			Project!.animated_java.preview_resource_packs = [args.packPath]
			await (window as any).AnimatedJava.previewResourcePack.applyPreviewResourcePack()
		},
		{ formatId: BLUEPRINT_FORMAT_ID, packPath: TTF_FONT_PACK }
	)
}

/** Loads `fontIds` against `version` and summarises how each of `chars` resolves. */
async function measure(
	version: string,
	fontIds: string[],
	chars: string[]
): Promise<Record<string, FontSummary>> {
	return blockbench.evaluate(
		async (args: { version: string; fontIds: string[]; chars: string[] }) => {
			const { MinecraftFont } = (window as any).AnimatedJava
			Project!.animated_java.target_minecraft_version = args.version
			const result: Record<string, FontSummary> = {}
			for (const id of args.fontIds) {
				const font = await MinecraftFont.getById(id)
				if (!font) throw new Error(`Font ${id} failed to load`)
				const glyphs: Record<string, GlyphSummary> = {}
				for (const char of args.chars) {
					const data = font.getChar(char)
					glyphs[char] = {
						type: data.type,
						width: data.width,
						ascent: data.ascent,
						bearingX: data.bearingX,
						scale: data.scale,
						fromTtf: !!data.atlas?.isDataTexture,
					}
				}
				result[id] = {
					providers: font.providers.map((p: { type: string }) => p.type),
					glyphs,
				}
			}
			return result
		},
		{ version, fontIds, chars }
	)
}

describe('ttf font providers', () => {
	it('draws covered glyphs from the font with FreeType metrics (1.20.5+)', async () => {
		await openProjectWithPack()
		const { 'ajtest:noto': noto } = await measure('26.2', ['ajtest:noto'], ['A', 'g', ' '])
		expect(noto.providers).toEqual(['ttf', 'reference'])

		const a = noto.glyphs.A
		expect(a).toMatchObject({ type: 'bitmap', fromTtf: true, scale: 1, bearingX: 0 })
		// Noto's "A" advance is 0.639 em: 7.03px at size 11, hinted to a whole 7.
		expect(a.width).toBe(7)
		// Cap height is 0.714 em (~7.9px), so the glyph's top sits 7-9px above the baseline.
		expect(a.ascent).toBeGreaterThanOrEqual(7)
		expect(a.ascent).toBeLessThanOrEqual(9)
		// "g" descends below the baseline, so its top is lower than "A"'s.
		expect(noto.glyphs.g.ascent).toBeLessThan(a.ascent!)
		expect(noto.glyphs[' ']).toEqual(expect.objectContaining({ type: 'space', width: 3 }))
	})

	it('falls through to the next provider for skipped and unmapped characters', async () => {
		await openProjectWithPack()
		const fonts = await measure('26.2', ['ajtest:noto', 'minecraft:default'], ['B', '0'])
		for (const char of ['B', '0']) {
			expect(fonts['ajtest:noto'].glyphs[char].fromTtf).toBe(false)
			expect(fonts['ajtest:noto'].glyphs[char]).toEqual(
				fonts['minecraft:default'].glyphs[char]
			)
		}
	})

	it('applies size, oversample and shift', async () => {
		await openProjectWithPack()
		const fonts = await measure(
			'26.2',
			['ajtest:noto', 'ajtest:noto_big', 'ajtest:noto_oversampled', 'ajtest:noto_shifted'],
			['A']
		)
		const base = fonts['ajtest:noto'].glyphs.A
		expect(fonts['ajtest:noto_big'].glyphs.A.width).toBe(14)

		// 4x the pixels for the same rendered size.
		const oversampled = fonts['ajtest:noto_oversampled'].glyphs.A
		expect(oversampled.scale).toBe(0.25)
		expect(oversampled.width).toBeCloseTo(7, 0)

		// FreeType shifts right by x and down by y; the advance is untouched.
		const shifted = fonts['ajtest:noto_shifted'].glyphs.A
		expect(shifted.width).toBe(base.width)
		expect(shifted.bearingX).toBe(base.bearingX! + 3)
		expect(shifted.ascent).toBe(base.ascent! - 2)
	})

	it('refuses CFF outlines on 1.20.5+, like FreeType, but loads them on 1.20.4', async () => {
		await openProjectWithPack()
		const modern = await measure('26.2', ['ajtest:cff'], ['A'])
		expect(modern['ajtest:cff'].providers).toEqual(['reference'])
		expect(modern['ajtest:cff'].glyphs.A.fromTtf).toBe(false)

		const legacy = await measure('1.20.4', ['ajtest:cff'], ['A'])
		expect(legacy['ajtest:cff'].providers).toEqual(['ttf', 'reference'])
		expect(legacy['ajtest:cff'].glyphs.A.fromTtf).toBe(true)
	})

	it('uses stb_truetype metrics on 1.20.4 and reloads fonts when the version changes', async () => {
		await openProjectWithPack()
		const legacy = await measure('1.20.4', ['ajtest:noto', 'ajtest:noto_shifted'], ['A'])
		const a = legacy['ajtest:noto'].glyphs.A
		// Ascent-to-descent (1362 units) spans 11px, so "A" is 639 * 11 / 1362 = 5.16px, unrounded.
		expect(a.fromTtf).toBe(true)
		expect(a.width).toBeCloseTo(5.16, 1)
		expect(Number.isInteger(a.width)).toBe(false)
		// stb applies the shift twice.
		const shifted = legacy['ajtest:noto_shifted'].glyphs.A
		expect(shifted.bearingX).toBe(a.bearingX! + 6)
		expect(shifted.ascent).toBeCloseTo(a.ascent! - 4, 5)

		const modern = await measure('26.2', ['ajtest:noto'], ['A'])
		expect(modern['ajtest:noto'].glyphs.A.width).toBe(7)
	})

	it('renders ttf glyphs into a text display mesh', async () => {
		await openProjectWithPack()
		const maps = await blockbench.evaluate(async () => {
			const { TextDisplay } = (window as any).AnimatedJava
			Project!.animated_java.target_minecraft_version = '26.2'
			const td = new TextDisplay({}).init()
			td.text = '{"text":"AB","font":"ajtest:noto"}'
			td.needsMeshUpdate = true
			td.updateTextMesh()
			for (let i = 0; i < 200; i++) {
				await new Promise(resolve => setTimeout(resolve, 25))
				const textMeshes: any[] = []
				td.mesh?.traverse((o: any) => {
					if (o.name === 'text' && o.material?.map) textMeshes.push(o)
				})
				if (textMeshes.length > 0) {
					return textMeshes.map(o => !!o.material.map.isDataTexture).sort()
				}
			}
			throw new Error('Text mesh never rendered')
		})
		// One batch from the ttf atlas ("A"), one from the vanilla atlas ("B", skipped).
		expect(maps).toEqual([false, true])
	})
})
