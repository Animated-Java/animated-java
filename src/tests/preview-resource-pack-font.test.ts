import { describe, expect, it } from '@jest/globals'
import { blockbench } from '@snavesutit/jestbench'
import * as path from 'node:path'

const BLUEPRINT_FORMAT_ID = 'animated-java:format/blueprint'
const FONT_OVERRIDE_PACK = path.resolve(process.cwd(), 'test-packs/font-override-pack')

/**
 * Regression test: preview resource pack font overlays silently failing to apply
 * to text displays.
 *
 * On project open, text displays start rendering from `Canvas.updateAll()` a
 * frame or two before `applyPreviewResourcePack()` runs. `applyPreviewResourcePack`
 * clears the font registry and the glyph-geometry / layout caches, but a
 * text-mesh build that is already in flight finishes just after that clear and
 * repopulates the glyph / layout caches with vanilla-font data. Those caches
 * were keyed by Minecraft version only, so the stale entry was then reused for
 * every later render even though the overlay had loaded - the custom font never
 * showed up.
 *
 * The scenario below reproduces that end state directly and deterministically:
 * the layout cache holds a "no overlay" entry for the text while the active pack
 * (and the font registry) have already moved on to the overlay. A fresh render
 * must not be served that stale entry.
 */
describe('preview resource pack font overlays', () => {
	it('are not served a stale layout cache from before the active pack changed', async () => {
		await blockbench.evaluate((formatId: string) => {
			const format = (globalThis as any).Formats[formatId]
			if (!format) throw new Error(`Format '${formatId}' is not registered`)
			;(globalThis as any).newProject(format)
		}, BLUEPRINT_FORMAT_ID)

		const result = await blockbench.evaluate(async (packPath: string) => {
			const aj = (window as any).AnimatedJava
			const { TextDisplay, MinecraftFont, assetManager, previewResourcePack } = aj

			const project = Project as any
			project.animated_java.preview_resource_packs = []
			await previewResourcePack.applyPreviewResourcePack()

			const td = new TextDisplay({}).init()
			td.text = '"A"'

			const rebuildAndMeasure = async (): Promise<number> => {
				td.needsMeshUpdate = true
				td.updateTextMesh()
				let last = Number.NaN
				let stable = 0
				for (let i = 0; i < 400; i++) {
					await new Promise(r => setTimeout(r, 25))
					const geo = td.mesh?.geometry
					if (!geo?.attributes?.position) continue
					geo.computeBoundingBox()
					const width = geo.boundingBox.max.x - geo.boundingBox.min.x
					if (width === last) {
						if (++stable >= 3) return width
					} else {
						stable = 0
					}
					last = width
				}
				return last
			}

			// 1. Render "A" with no overlay - primes the glyph / layout caches
			//    with vanilla-font data.
			const vanillaWidth = await rebuildAndMeasure()

			// 2. Reproduce the post-race state: the overlay pack is now active and
			//    the font registry has been cleared (both done by
			//    `applyPreviewResourcePack`), but the glyph / layout caches were
			//    re-dirtied by a straggler render right after they were cleared -
			//    so they still hold the step 1 vanilla entries.
			await assetManager.setPreviewResourcePacks([packPath])
			MinecraftFont.all.clear()
			const packKey = assetManager.getPreviewResourcePackKey() as string

			// 3. A fresh render must rebuild from the overlay, not reuse step 1.
			const overriddenWidth = await rebuildAndMeasure()

			return { vanillaWidth, overriddenWidth, packKey }
		}, FONT_OVERRIDE_PACK)

		// The fixture sets the advance of "A" to 100px; vanilla is ~6px. Widths
		// are world units: (layoutWidth + 1) * 0.4, so ~2.8 vanilla vs ~40 with
		// the overlay.
		expect(result.packKey).toBeTruthy()
		expect(result.vanillaWidth).toBeGreaterThan(0)
		expect(result.vanillaWidth).toBeLessThan(10)
		expect(result.overriddenWidth).toBeGreaterThan(20)
	})
})
