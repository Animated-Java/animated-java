import { describe, expect, it } from '@jest/globals'
import { blockbench } from '@snavesutit/jestbench'

const BLUEPRINT_FORMAT_ID = 'animated-java:format/blueprint'

/**
 * `renderRig` walks the Blockbench outliner into a version-agnostic
 * `IRenderedRig`. This pins the node-type mapping, the custom-model flag, the
 * texture collection and `hashRig`'s change detection.
 */
describe('rigRenderer.renderRig', () => {
	it('maps each outliner node type to a rendered node', async () => {
		const result = await blockbench.evaluate((formatId: string) => {
			const aj = (window as any).AnimatedJava
			const g = globalThis as any
			g.newProject(g.Formats[formatId])

			const texture = new Texture({ name: 'skin.png' }, undefined).add(false)

			const bone = new Group({ name: 'root' }).init()
			const cube = new Cube({ name: 'box', from: [0, 0, 0], to: [4, 4, 4] }).init()
			cube.addTo(bone)
			for (const face of Object.keys(cube.faces)) cube.faces[face].texture = texture.uuid

			new Locator({ name: 'loc', position: [0, 1, 0] }).init()
			const textDisplay = new aj.TextDisplay({}).init()
			textDisplay.text = '"hi"'

			const rig = aj.renderRig(
				'assets/aj/models/blueprint/test',
				'assets/aj/textures/blueprint/test'
			)

			const nodes = Object.values(rig.nodes) as any[]
			const byType = (t: string) => nodes.filter(n => n.type === t)
			return {
				types: nodes.map(n => n.type).sort(),
				boneHasTransform: byType('bone').every(
					n =>
						Array.isArray(n.default_transform.pos) &&
						Array.isArray(n.default_transform.rot) &&
						Array.isArray(n.default_transform.scale)
				),
				textDisplayText: byType('text_display')[0]?.text,
				locatorName: byType('locator')[0]?.name,
				cubeChildOfBone: cube.parent === bone,
				includesCustomModels: rig.includes_custom_models,
				textureCollected: Object.values(rig.textures).some(
					(t: any) => t.name === 'skin.png'
				),
				exportFolders: [rig.model_export_folder, rig.texture_export_folder],
				hasDefaultVariant: Object.keys(rig.variants).length >= 1,
			}
		}, BLUEPRINT_FORMAT_ID)

		expect(result.types).toEqual(['bone', 'locator', 'text_display'])
		expect(result.boneHasTransform).toBe(true)
		expect(result.textDisplayText).toBe('"hi"')
		expect(result.locatorName).toBe('loc')
		expect(result.includesCustomModels).toBe(true)
		expect(result.textureCollected).toBe(true)
		expect(result.exportFolders).toEqual([
			'assets/aj/models/blueprint/test',
			'assets/aj/textures/blueprint/test',
		])
		expect(result.hasDefaultVariant).toBe(true)
	})

	it('leaves includes_custom_models false for a rig with no cubes', async () => {
		const flag = await blockbench.evaluate((formatId: string) => {
			const aj = (window as any).AnimatedJava
			const g = globalThis as any
			g.newProject(g.Formats[formatId])
			new Locator({ name: 'loc' }).init()
			return aj.renderRig('assets/aj/models/blueprint/x', 'assets/aj/textures/blueprint/x')
				.includes_custom_models
		}, BLUEPRINT_FORMAT_ID)
		expect(flag).toBe(false)
	})

	it('hashRig is stable for an unchanged rig and changes when geometry moves', async () => {
		const result = await blockbench.evaluate((formatId: string) => {
			const aj = (window as any).AnimatedJava
			const g = globalThis as any
			g.newProject(g.Formats[formatId])

			const texture = new Texture({ name: 't.png' }, undefined).add(false)
			const bone = new Group({ name: 'b' }).init()
			const cube = new Cube({ name: 'c', from: [0, 0, 0], to: [2, 2, 2] }).init()
			cube.addTo(bone)
			for (const face of Object.keys(cube.faces)) cube.faces[face].texture = texture.uuid

			const render = () =>
				aj.renderRig('assets/aj/models/blueprint/x', 'assets/aj/textures/blueprint/x')

			const hashA = aj.hashRig(render())
			const hashB = aj.hashRig(render())

			bone.origin = [5, 0, 0]
			const hashC = aj.hashRig(render())

			return { hashA, hashB, hashC }
		}, BLUEPRINT_FORMAT_ID)

		expect(typeof result.hashA).toBe('string')
		expect(result.hashA).toHaveLength(64)
		expect(result.hashB).toBe(result.hashA)
		expect(result.hashC).not.toBe(result.hashA)
	})
})
