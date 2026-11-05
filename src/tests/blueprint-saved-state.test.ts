import { describe, expect, it } from '@jest/globals'
import { blockbench } from '@snavesutit/jestbench'
import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'

/**
 * Opening a Blueprint must leave it saved. Loading links internal textures that
 * still have a file on disk, which the `fromPath` patch in `textureLinkIcon.ts`
 * would otherwise read as a user "Save As" and mark the project dirty.
 */
const BLUEPRINT_FORMAT_ID = 'animated-java:format/blueprint'
const PNG_1X1 =
	'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='

describe('Blueprint saved state', () => {
	it('stays saved after loading an internal texture that links to a file', async () => {
		const workDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aj-saved-'))
		const texturePath = path.join(workDir, 'skin.png')
		fs.writeFileSync(texturePath, Buffer.from(PNG_1X1, 'base64'))

		try {
			const result = await blockbench.evaluate(
				(args: { formatId: string; texturePath: string; blueprintPath: string }) => {
					const aj = (window as any).AnimatedJava
					const codec = aj.BLUEPRINT_CODEC.get()
					const g = globalThis as any

					g.newProject(g.Formats[args.formatId])
					new Texture({ name: 'skin.png' }, undefined).add(false)
					const model = codec.compile({ raw: true, bitmaps: false })
					Object.assign(model.textures[0], { internal: true, path: args.texturePath })

					g.newProject(g.Formats[args.formatId])
					codec.load(model, {
						name: 'saved.ajblueprint',
						path: args.blueprintPath,
						no_file: true,
					})
					const afterLoad = {
						saved: Project!.saved,
						internal: Texture.all[0]?.internal,
					}

					// A relink after loading is still an edit.
					const relinked = new Texture({ name: 'other.png', internal: true }).add(false)
					Project!.saved = true
					relinked.fromPath(args.texturePath)

					return { afterLoad, savedAfterRelink: Project!.saved }
				},
				{
					formatId: BLUEPRINT_FORMAT_ID,
					texturePath,
					blueprintPath: path.join(workDir, 'saved.ajblueprint'),
				}
			)

			expect(result.afterLoad).toEqual({ saved: true, internal: false })
			expect(result.savedAfterRelink).toBe(false)
		} finally {
			fs.rmSync(workDir, { recursive: true, force: true })
		}
	})
})
