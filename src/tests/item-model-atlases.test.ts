import { afterAll, describe, expect, it } from '@jest/globals'
import { blockbench } from '@snavesutit/jestbench'
import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'

const BLUEPRINT_FORMAT_ID = 'animated-java:format/blueprint'

/** A 16x16 opaque white PNG. */
const PNG_BASE64 =
	'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAGElEQVR4nGP4TyFgGDVgNAxG08H/YRIGAF14/C7HG9CXAAAAAElFTkSuQmCC'

const WORK_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'aj-atlas-'))

/** Writes a PNG into a resource pack layout, so AJ links it in place by resource location. */
function linkedTexture(resourcePath: string) {
	const file = path.join(
		WORK_DIR,
		'linked',
		'assets',
		'minecraft',
		'textures',
		resourcePath + '.png'
	)
	fs.mkdirSync(path.dirname(file), { recursive: true })
	fs.writeFileSync(file, Buffer.from(PNG_BASE64, 'base64'))
	return file
}

interface SceneOptions {
	version: string
	/** Linked textures for the bone. The first goes on every face but south, which gets the second. */
	linked: string[]
	/** Sources written to the export pack's blocks atlas before exporting. */
	blockAtlasSources?: unknown[]
}

let sceneCount = 0

/** Exports one bone with a linked texture, returning whether it exported and any error message. */
async function exportScene(options: SceneOptions) {
	const folder = path.join(WORK_DIR, `scene_${sceneCount++}`)
	const dataPackFolder = path.join(folder, 'datapack')
	const resourcePackFolder = path.join(folder, 'resourcepack')
	for (const pack of [dataPackFolder, resourcePackFolder]) {
		fs.mkdirSync(pack, { recursive: true })
		fs.writeFileSync(
			path.join(pack, 'pack.mcmeta'),
			JSON.stringify({ pack: { pack_format: 48, description: 'aj test' } })
		)
	}
	if (options.blockAtlasSources) {
		const atlas = path.join(resourcePackFolder, 'assets/minecraft/atlases/blocks.json')
		fs.mkdirSync(path.dirname(atlas), { recursive: true })
		fs.writeFileSync(atlas, JSON.stringify({ sources: options.blockAtlasSources }))
	}

	return blockbench.evaluate(
		async (args: {
			formatId: string
			version: string
			linked: string[]
			dataPackFolder: string
			resourcePackFolder: string
		}) => {
			const aj = (window as any).AnimatedJava
			const g = globalThis as any
			g.newProject(g.Formats[args.formatId])

			const settings = Project!.animated_java
			settings.enable_plugin_mode = false
			settings.enable_advanced_data_pack_settings = true
			settings.enable_advanced_resource_pack_settings = true
			settings.data_pack_export_mode = 'folder'
			settings.resource_pack_export_mode = 'folder'
			settings.data_pack = args.dataPackFolder
			settings.resource_pack = args.resourcePackFolder
			settings.target_minecraft_version = args.version

			const linked = args.linked.map(file =>
				new Texture({ name: PathModule.basename(file), path: file }, undefined).add(false)
			)
			const bone = new Group({ name: 'bone' }).init()
			const cube = new Cube({ name: 'cube', from: [0, 0, 0], to: [4, 4, 4] })
				.addTo(bone)
				.init()
			for (const face of Object.values(cube.faces) as CubeFace[])
				face.texture = linked[0].uuid
			cube.faces.south.texture = (linked[1] ?? linked[0]).uuid

			const messages: string[] = []
			const showMessageBox = Blockbench.showMessageBox
			Blockbench.showMessageBox = (options: MessageBoxOptions) => {
				messages.push(String(options.message ?? ''))
				return undefined as any
			}
			try {
				const ok = await aj.exportProject()
				return { ok: ok as boolean, message: messages.join('\n') }
			} finally {
				Blockbench.showMessageBox = showMessageBox
			}
		},
		{
			formatId: BLUEPRINT_FORMAT_ID,
			version: options.version,
			linked: options.linked,
			dataPackFolder,
			resourcePackFolder,
		}
	)
}

/**
 * `src/systems/resourcepackCompiler/itemModelAtlases.ts` - item models only draw from the blocks
 * atlas before 1.21.11, and from items or blocks (one per model) after.
 */
describe('item model atlas check', () => {
	afterAll(() => fs.rmSync(WORK_DIR, { recursive: true, force: true }))

	it('fails on 1.21.4 for a linked texture outside the blocks atlas', async () => {
		const result = await exportScene({
			version: '1.21.4',
			linked: [linkedTexture('entity/atlas_test/skin')],
		})
		expect(result.ok).toBe(false)
		expect(result.message).toContain('minecraft:entity/atlas_test/skin')
		expect(result.message).toContain('(blocks)')
		expect(result.message).toContain('Preview resource pack')
	}, 180_000)

	it("passes on 1.21.4 once the export pack's own atlas includes the texture", async () => {
		const result = await exportScene({
			version: '1.21.4',
			linked: [linkedTexture('entity/atlas_test/skin')],
			blockAtlasSources: [
				{
					type: 'minecraft:directory',
					source: 'entity/atlas_test',
					prefix: 'entity/atlas_test/',
				},
			],
		})
		expect(result.message).toBe('')
		expect(result.ok).toBe(true)
	}, 180_000)

	it('passes on 26.2 for a bone drawn only from the items atlas', async () => {
		const result = await exportScene({
			version: '26.2',
			linked: [linkedTexture('item/atlas_test_item')],
		})
		expect(result.message).toBe('')
		expect(result.ok).toBe(true)
	}, 180_000)

	it('fails on 26.2 for a bone mixing items and blocks textures', async () => {
		const result = await exportScene({
			version: '26.2',
			linked: [
				linkedTexture('item/atlas_test_item'),
				linkedTexture('block/atlas_test_block'),
			],
		})
		expect(result.ok).toBe(false)
		expect(result.message).toContain('mixes textures from more than one atlas')
		expect(result.message).toContain('items (minecraft:item/atlas_test_item)')
		expect(result.message).toContain('blocks (minecraft:block/atlas_test_block')
	}, 180_000)
})
