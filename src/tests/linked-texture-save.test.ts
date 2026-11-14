import { describe, expect, it } from '@jest/globals'
import { blockbench } from '@snavesutit/jestbench'
import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'

/**
 * Saving must write edits to file-backed textures back to their files. `textureLinkIcon.ts` once
 * no-op'd `save()` for resource pack textures, and for any edited file texture, since Blockbench
 * flags those `internal` until they're saved.
 */
const BLUEPRINT_FORMAT_ID = 'animated-java:format/blueprint'
const PNG_1X1 =
	'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='

describe('Linked texture saving', () => {
	it.each([
		{ kind: 'resource pack', file: 'assets/minecraft/textures/block/skin.png', link: true },
		{ kind: 'plain file', file: 'skin.png', link: false },
	])('writes edits to a $kind texture back to its file', async ({ file, link }) => {
		const workDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aj-linked-'))
		const texturePath = path.join(workDir, file)
		fs.mkdirSync(path.dirname(texturePath), { recursive: true })
		fs.writeFileSync(texturePath, Buffer.from(PNG_1X1, 'base64'))

		try {
			const result = await blockbench.evaluate(
				async (args: { formatId: string; texturePath: string }) => {
					const g = globalThis as any
					g.newProject(g.Formats[args.formatId])

					const texture = new Texture({ name: 'skin.png' })
						.fromPath(args.texturePath)
						.add(false)
					const waitFor = (check: () => boolean) =>
						new Promise<void>(resolve => {
							const poll = () => (check() ? resolve() : setTimeout(poll, 50))
							poll()
						})
					const frames = () =>
						new Promise(resolve =>
							requestAnimationFrame(() => requestAnimationFrame(resolve))
						)
					const icons = () => {
						const saveIcon = document.querySelector(
							`li[texid="${texture.uuid}"] .texture_save_icon`
						)
						return {
							save: saveIcon?.textContent?.trim(),
							link: !!saveIcon?.previousElementSibling?.classList.contains(
								'aj_texture_link_icon'
							),
						}
					}
					await waitFor(() => texture.img.complete && texture.img.naturalWidth > 0)

					texture.edit((canvas: HTMLCanvasElement) => {
						const ctx = canvas.getContext('2d')!
						ctx.fillStyle = '#ff0000'
						ctx.fillRect(0, 0, canvas.width, canvas.height)
					})
					await frames()
					const iconsUnsaved = icons()

					await g.saveTextures(true)
					await frames()
					const iconsSaved = icons()

					return { saved: texture.saved, iconsUnsaved, iconsSaved }
				},
				{ formatId: BLUEPRINT_FORMAT_ID, texturePath }
			)

			expect(result.saved).toBe(true)
			expect(result.iconsUnsaved).toEqual({ save: 'save', link })
			expect(result.iconsSaved).toEqual({ save: 'check_circle', link })
			expect(fs.readFileSync(texturePath).equals(Buffer.from(PNG_1X1, 'base64'))).toBe(false)
		} finally {
			fs.rmSync(workDir, { recursive: true, force: true })
		}
	})
})
