import { describe, expect, it } from '@jest/globals'
import { blockbench } from '@snavesutit/jestbench'

const BLUEPRINT_FORMAT_ID = 'animated-java:format/blueprint'
const MODEL_FOLDER = 'assets/aj/models/blueprint/test'
const TEXTURE_FOLDER = 'assets/aj/textures/blueprint/test'

/**
 * `src/variants.ts` - a Blueprint's variant list. Each `Variant` carries a
 * display name, a storage-safe `name`, a `TextureMap` (texture-swap overrides),
 * a list of excluded bones and an optional `on_apply` function. Exactly one
 * variant is the default.
 */
describe('Variants', () => {
	it('construct with unique names and enforce a single default', async () => {
		const result = await blockbench.evaluate((formatId: string) => {
			const aj = (window as any).AnimatedJava
			const g = globalThis as any
			g.newProject(g.Formats[formatId])

			const def = aj.Variant.getDefault()

			const a = new aj.Variant('My Variant')
			const b = new aj.Variant('My Variant') // collides -> gets suffixed
			const c = new aj.Variant('weird / name!')

			let secondDefaultError = ''
			try {
				new aj.Variant('Another', true)
			} catch (e: any) {
				secondDefaultError = String(e.message ?? e)
			}

			return {
				defaultIsDefault: def.isDefault,
				defaultName: def.name,
				aName: a.name,
				displayNamesUnique: new Set([a.displayName, b.displayName]).size === 2,
				storageNamesUnique: new Set([a.name, b.name]).size === 2,
				sanitized: c.name,
				aInAll: aj.Variant.all.includes(a),
				exactlyOneDefault: aj.Variant.all.filter((v: any) => v.isDefault).length === 1,
				secondDefaultError,
			}
		}, BLUEPRINT_FORMAT_ID)

		expect(result.defaultIsDefault).toBe(true)
		expect(result.defaultName).toBe('default')
		expect(result.aName).toBe('my_variant')
		expect(result.displayNamesUnique).toBe(true)
		expect(result.storageNamesUnique).toBe(true)
		expect(result.sanitized).toMatch(/^[a-z0-9_]+$/)
		expect(result.aInAll).toBe(true)
		expect(result.exactlyOneDefault).toBe(true)
		expect(result.secondDefaultError).toMatch(/only be one default/i)
	})

	it('toJSON / fromJSON round-trip name, texture map, excluded nodes and on_apply', async () => {
		const result = await blockbench.evaluate((formatId: string) => {
			const aj = (window as any).AnimatedJava
			const g = globalThis as any
			g.newProject(g.Formats[formatId])

			const texA = new Texture({ name: 'a.png' }, undefined).add(false)
			const texB = new Texture({ name: 'b.png' }, undefined).add(false)
			const bone = new Group({ name: 'excluded_bone' }).init()

			const variant = new aj.Variant('Red')
			variant.textureMap.add(texA.uuid, texB.uuid)
			variant.onApplyFunction = 'test:on_apply'
			variant.excludedNodes = [{ name: bone.name, value: bone.uuid }]

			const json = variant.toJSON()
			// Remove the original so `fromJSON` doesn't uniquify the restored name.
			variant.delete()
			const restored = aj.Variant.fromJSON(json)

			return {
				json,
				restoredDisplayName: restored.displayName,
				restoredMapped: restored.textureMap.get(texA.uuid),
				restoredOnApply: restored.onApplyFunction,
				restoredExcluded: restored.excludedNodes.map((n: any) => n.value),
				boneUuid: bone.uuid,
			}
		}, BLUEPRINT_FORMAT_ID)

		expect(result.json.display_name).toBe('Red')
		expect(result.json.texture_map).toBeDefined()
		expect(result.json.on_apply_function).toBe('test:on_apply')
		expect(result.restoredDisplayName).toBe('Red')
		expect(result.restoredMapped).toBeTruthy()
		expect(result.restoredOnApply).toBe('test:on_apply')
		expect(result.restoredExcluded).toContain(result.boneUuid)
	})

	it('survive a codec compile → parse round-trip', async () => {
		const result = await blockbench.evaluate((formatId: string) => {
			const aj = (window as any).AnimatedJava
			const codec = aj.BLUEPRINT_CODEC.get()
			const g = globalThis as any
			g.newProject(g.Formats[formatId])

			const texA = new Texture({ name: 'a.png' }, undefined).add(false)
			const texB = new Texture({ name: 'b.png' }, undefined).add(false)
			const bone = new Group({ name: 'b' }).init()

			const red = new aj.Variant('Red')
			red.textureMap.add(texA.uuid, texB.uuid)

			const blue = new aj.Variant('Blue')
			blue.onApplyFunction = 'test:blue'
			blue.excludedNodes = [{ name: bone.name, value: bone.uuid }]

			const compiled = codec.compile({ raw: true, bitmaps: false })
			g.newProject(g.Formats[formatId])
			codec.parse(compiled, 'variants.ajblueprint')

			const all = aj.Variant.all as any[]
			const byName = (n: string) => all.find(v => v.displayName === n)
			return {
				names: all.map(v => v.displayName).sort(),
				defaultCount: all.filter(v => v.isDefault).length,
				redHasMapping: byName('Red')?.textureMap.map.size > 0,
				blueOnApply: byName('Blue')?.onApplyFunction,
				blueExcludes: byName('Blue')?.excludedNodes.length,
			}
		}, BLUEPRINT_FORMAT_ID)

		expect(result.names).toEqual(['Blue', 'Default', 'Red'])
		expect(result.defaultCount).toBe(1)
		expect(result.redHasMapping).toBe(true)
		expect(result.blueOnApply).toBe('test:blue')
		expect(result.blueExcludes).toBe(1)
	})

	it('renderRig emits a rendered variant per Variant', async () => {
		const result = await blockbench.evaluate(
			(args: { formatId: string; modelFolder: string; textureFolder: string }) => {
				const aj = (window as any).AnimatedJava
				const g = globalThis as any
				g.newProject(g.Formats[args.formatId])

				const texture = new Texture({ name: 't.png' }, undefined).add(false)
				const bone = new Group({ name: 'bone' }).init()
				const cube = new Cube({ name: 'c', from: [0, 0, 0], to: [4, 4, 4] }).init()
				cube.addTo(bone)
				for (const face of Object.keys(cube.faces)) {
					cube.faces[face].texture = texture.uuid
				}

				new aj.Variant('Red')

				const rig = aj.renderRig(args.modelFolder, args.textureFolder)
				const variants = Object.values(rig.variants) as any[]
				return {
					count: variants.length,
					everyHasModels: variants.every(v => typeof v.models === 'object'),
					displayNames: variants.map(v => v.display_name).sort(),
				}
			},
			{
				formatId: BLUEPRINT_FORMAT_ID,
				modelFolder: MODEL_FOLDER,
				textureFolder: TEXTURE_FOLDER,
			}
		)

		expect(result.count).toBe(2)
		expect(result.everyHasModels).toBe(true)
		expect(result.displayNames).toEqual(['Default', 'Red'])
	})

	it('TextureMap maps, remaps and prunes dangling entries', async () => {
		const result = await blockbench.evaluate((formatId: string) => {
			const aj = (window as any).AnimatedJava
			const g = globalThis as any
			g.newProject(g.Formats[formatId])

			const texA = new Texture({ name: 'a.png' }, undefined).add(false)
			const texB = new Texture({ name: 'b.png' }, undefined).add(false)
			const texGone = new Texture({ name: 'gone.png' }, undefined).add(false)

			const variant = new aj.Variant('V')
			variant.textureMap.setMappedTexture(texA, texB)
			variant.textureMap.add(texB.uuid, texGone.uuid)

			const mappedA = variant.textureMap.getMappedTexture(texA)?.name
			texGone.remove()
			variant.textureMap.verifyTextures()

			return {
				mappedA,
				stillHasA: variant.textureMap.has(texA.uuid),
				prunedB: variant.textureMap.has(texB.uuid),
			}
		}, BLUEPRINT_FORMAT_ID)

		expect(result.mappedA).toBe('b.png')
		expect(result.stillHasA).toBe(true)
		expect(result.prunedB).toBe(false)
	})
})
