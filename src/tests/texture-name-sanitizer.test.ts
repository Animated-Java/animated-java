import { describe, expect, it } from '@jest/globals'
import { blockbench } from '@snavesutit/jestbench'
import * as path from 'node:path'

const BLUEPRINT_FORMAT_ID = 'animated-java:format/blueprint'

// A committed fixture texture inside a valid resource pack layout
// (assets/<ns>/textures/...). Must exist on disk - the sanitizer only treats a
// texture as "linked" when its path resolves to a real file.
const LINKED_TEXTURE = path.resolve(
	process.cwd(),
	'test-packs/linked-texture-pack/assets/animated_java/textures/blueprint/armor_stand/wood.png'
)

/**
 * Regression test for #337: internal texture names accepted any character and
 * allowed duplicates. Textures linked from a resource pack are referenced by
 * resource location, so their names are left alone and may collide with an
 * internal texture's name.
 */
describe('texture name sanitizer', () => {
	it('lowercases, replaces invalid characters, and de-duplicates internal textures', async () => {
		const result = await blockbench.evaluate((formatId: string) => {
			const g = globalThis as any
			g.newProject(g.Formats[formatId])

			const a = new Texture({ name: 'My Texture!.png' }, undefined).add(false)
			const b = new Texture({ name: 'my texture_.png' }, undefined).add(false)
			const c = new Texture({ name: '???.png' }, undefined).add(false)

			return { a: a.name, b: b.name, c: c.name }
		}, BLUEPRINT_FORMAT_ID)

		expect(result.a).toBe('my_texture_.png')
		expect(result.b).toBe('my_texture__2.png')
		expect(result.c).toBe('___.png')
	})

	it('leaves resource-pack-linked textures alone, even when they duplicate an internal name', async () => {
		const result = await blockbench.evaluate(
			(arg: { formatId: string; linkedPath: string }) => {
				const g = globalThis as any
				g.newProject(g.Formats[arg.formatId])

				const linked = new Texture(
					{ name: 'wood.png', path: arg.linkedPath },
					undefined
				).add(false)
				const internal = new Texture({ name: 'wood.png' }, undefined).add(false)

				return { linked: linked.name, internal: internal.name }
			},
			{ formatId: BLUEPRINT_FORMAT_ID, linkedPath: LINKED_TEXTURE }
		)

		expect(result.linked).toBe('wood.png')
		expect(result.internal).toBe('wood.png')
	})
})
