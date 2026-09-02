import { describe, expect, it } from '@jest/globals'
import { blockbench } from '@snavesutit/jestbench'

const BLUEPRINT_FORMAT_ID = 'animated-java:format/blueprint'

/**
 * Regression test for #407: the Blueprint codec saved and restored bone groups
 * but never texture groups, so reopening a project dropped every texture group
 * and left its textures at the root of the list.
 */
describe('Blueprint format: texture groups', () => {
	it('survive a compile / parse round-trip', async () => {
		const result = await blockbench.evaluate((formatId: string) => {
			const aj = (window as any).AnimatedJava
			const codec = aj.BLUEPRINT_CODEC.get()
			const g = globalThis as any

			g.newProject(g.Formats[formatId])
			const group = new g.TextureGroup({ name: 'my_group' }, undefined).add(false)
			const grouped = new Texture({ name: 'in_group.png' }, undefined).add(false)
			new Texture({ name: 'loose.png' }, undefined).add(false)
			grouped.group = group.uuid

			const model = codec.compile({ raw: true, bitmaps: false })

			g.newProject(g.Formats[formatId])
			codec.parse(model, 'roundtrip.ajblueprint')

			const groups = g.TextureGroup.all as Array<{ uuid: string; name: string }>
			return {
				groupCount: groups.length,
				groupName: groups[0]?.name,
				groupedRefMatches:
					Texture.all.find(t => t.name === 'in_group.png')?.group === groups[0]?.uuid,
				looseGroup: Texture.all.find(t => t.name === 'loose.png')?.group,
			}
		}, BLUEPRINT_FORMAT_ID)

		expect(result.groupCount).toBe(1)
		expect(result.groupName).toBe('my_group')
		expect(result.groupedRefMatches).toBe(true)
		expect(result.looseGroup).toBeFalsy()
	})
})
