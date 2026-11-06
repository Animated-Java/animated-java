import { afterAll, describe, expect, it } from '@jest/globals'
import { blockbench } from '@snavesutit/jestbench'
import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'

const BLUEPRINT_FORMAT_ID = 'animated-java:format/blueprint'
const WORK_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'aj-zip-'))

/**
 * fflate's async `zip` compresses files over 160KB in a worker, which the production build's
 * `keepNames` breaks. A noise texture barely compresses, so it takes that path.
 */
describe('zip export', () => {
	afterAll(() => fs.rmSync(WORK_DIR, { recursive: true, force: true }))

	it('zips a resource pack with a file over 160KB', async () => {
		const zipPath = path.join(WORK_DIR, 'resourcepack.zip')
		const ok = await blockbench.evaluate(
			async (args: { formatId: string; zipPath: string }) => {
				const g = globalThis as any
				g.newProject(g.Formats[args.formatId])
				const canvas = document.createElement('canvas')
				canvas.width = canvas.height = 512
				const ctx = canvas.getContext('2d')!
				const image = ctx.createImageData(512, 512)
				for (let i = 0; i < image.data.length; i++) image.data[i] = (i * 2654435761) >>> 24
				ctx.putImageData(image, 0, 0)
				const texture = new Texture({ name: 'noise.png' })
					.fromDataURL(canvas.toDataURL())
					.add(false)
				await new Promise(resolve =>
					texture.img.addEventListener('load', resolve, { once: true })
				)
				const bone = new Group({ name: 'bone' }).init()
				const cube = new Cube({ name: 'cube', from: [0, 0, 0], to: [1, 1, 1] })
					.addTo(bone)
					.init()
				for (const face of Object.values(cube.faces) as CubeFace[])
					face.texture = texture.uuid

				Object.assign(Project!.animated_java, {
					enable_plugin_mode: false,
					enable_advanced_data_pack_settings: true,
					enable_advanced_resource_pack_settings: true,
					data_pack_export_mode: 'none',
					resource_pack_export_mode: 'zip',
					resource_pack: args.zipPath,
					target_minecraft_version: '1.21.4',
				})
				return (window as any).AnimatedJava.exportProject() as Promise<boolean>
			},
			{ formatId: BLUEPRINT_FORMAT_ID, zipPath }
		)
		expect(ok).toBe(true)
		expect(fs.statSync(zipPath).size).toBeGreaterThan(160_000)
	}, 180_000)
})
