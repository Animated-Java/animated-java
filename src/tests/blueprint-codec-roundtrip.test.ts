import { describe, expect, it } from '@jest/globals'
import { blockbench } from '@snavesutit/jestbench'

const BLUEPRINT_FORMAT_ID = 'animated-java:format/blueprint'

/**
 * Broad round-trip coverage for the Blueprint codec: build a project that
 * exercises bones, cubes, a locator, a text display, an extra variant, an
 * animation and several non-default settings, then `compile` -> fresh project
 * -> `parse` and assert every piece came back.
 *
 * Complements `blueprint-texture-groups.test.ts` (#407), which pins one field.
 */
describe('Blueprint codec: full round-trip', () => {
	it('preserves outliner nodes, variants, animations and settings', async () => {
		const result = await blockbench.evaluate((formatId: string) => {
			const aj = (window as any).AnimatedJava
			const codec = aj.BLUEPRINT_CODEC.get()
			const g = globalThis as any

			g.newProject(g.Formats[formatId])

			// A texture so cubes have something to reference.
			const texture = new Texture({ name: 'skin.png' }, undefined).add(false)

			// Bone hierarchy: root_bone > child_bone, with a cube in the child.
			const root = new Group({ name: 'root_bone' }).init()
			const child = new Group({ name: 'child_bone' }).init()
			child.addTo(root)

			const cube = new Cube({ name: 'body', from: [0, 0, 0], to: [8, 8, 8] }).init()
			cube.addTo(child)
			for (const face of Object.keys(cube.faces)) {
				cube.faces[face].texture = texture.uuid
			}

			const locator = new Locator({ name: 'muzzle', position: [1, 2, 3] }).init()
			locator.addTo(root)

			const textDisplay = new aj.TextDisplay({}).init()
			textDisplay.text = '"Hello"'

			// Extra variant beyond the default.
			new aj.Variant('Red')

			// An animation.
			const animation = new Blockbench.Animation({ name: 'walk' })
			animation.add()

			// Non-default settings.
			Project.animated_java.blueprint_id = 'test:roundtrip'
			Project.animated_java.interpolation_duration = 5
			Project.animated_java.shadow_radius = 3
			Project.animated_java.on_summon_function = 'test:on_summon'

			const compiled = codec.compile({ raw: true, bitmaps: false })

			g.newProject(g.Formats[formatId])
			codec.parse(compiled, 'roundtrip.ajblueprint')

			return {
				groupNames: Group.all.map((group: any) => group.name).sort(),
				childParentName: Group.all.find((group: any) => group.name === 'child_bone')?.parent
					?.name,
				cubeCount: Cube.all.length,
				cubeName: Cube.all[0]?.name,
				locatorNames: Locator.all.map((l: any) => l.name),
				textDisplayCount: aj.TextDisplay.all.length,
				textDisplayText: aj.TextDisplay.all[0]?.text,
				variantDisplayNames: aj.Variant.all.map((v: any) => v.displayName).sort(),
				variantHasOneDefault: aj.Variant.all.filter((v: any) => v.isDefault).length === 1,
				animationNames: Blockbench.Animation.all.map((a: any) => a.name),
				settings: {
					blueprint_id: Project.animated_java.blueprint_id,
					interpolation_duration: Project.animated_java.interpolation_duration,
					shadow_radius: Project.animated_java.shadow_radius,
					on_summon_function: Project.animated_java.on_summon_function,
					// A field left at its default must still round-trip correctly.
					teleportation_duration: Project.animated_java.teleportation_duration,
				},
			}
		}, BLUEPRINT_FORMAT_ID)

		expect(result.groupNames).toEqual(['child_bone', 'root_bone'])
		expect(result.childParentName).toBe('root_bone')

		expect(result.cubeCount).toBe(1)
		expect(result.cubeName).toBe('body')

		expect(result.locatorNames).toEqual(['muzzle'])

		expect(result.textDisplayCount).toBe(1)
		expect(result.textDisplayText).toBe('"Hello"')

		expect(result.variantDisplayNames).toEqual(['Default', 'Red'])
		expect(result.variantHasOneDefault).toBe(true)

		expect(result.animationNames).toContain('walk')

		expect(result.settings).toEqual({
			blueprint_id: 'test:roundtrip',
			interpolation_duration: 5,
			shadow_radius: 3,
			on_summon_function: 'test:on_summon',
			teleportation_duration: 1,
		})
	})
})
