import { describe, expect, it } from '@jest/globals'
import { blockbench } from '@snavesutit/jestbench'

const BLUEPRINT_FORMAT_ID = 'animated-java:format/blueprint'
const MODEL_FOLDER = 'assets/aj/models/blueprint/test'
const TEXTURE_FOLDER = 'assets/aj/textures/blueprint/test'

/**
 * `src/variants.ts` - a Blueprint's variant list. Each `Variant` carries a
 * display name, a storage-safe `name`, the texture each Texture Slot switches to,
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

	it('toJSON / fromJSON round-trip name, slot textures, excluded nodes and on_apply', async () => {
		const result = await blockbench.evaluate((formatId: string) => {
			const aj = (window as any).AnimatedJava
			const g = globalThis as any
			g.newProject(g.Formats[formatId])

			const texA = new Texture({ name: 'a.png' }, undefined).add(false)
			const texB = new Texture({ name: 'b.png' }, undefined).add(false)
			const bone = new Group({ name: 'excluded_bone' }).init()
			const slot = aj.textureSlots.createTextureSlot([texA, texB])

			const variant = new aj.Variant('Red')
			variant.slotTextures.set(slot.uuid, texB.uuid)
			variant.onApplyFunction = 'test:on_apply'
			variant.excludedNodes = new Set([bone.uuid])

			const json = variant.toJSON()
			// Remove the original so `fromJSON` doesn't uniquify the restored name.
			variant.delete()
			const restored = aj.Variant.fromJSON(json)

			return {
				json,
				restoredDisplayName: restored.displayName,
				restoredSlotTexture: restored.slotTextures.get(slot.uuid) === texB.uuid,
				restoredOnApply: restored.onApplyFunction,
				restoredExcluded: [...restored.excludedNodes],
				boneUuid: bone.uuid,
				expectedSlotTextures: { [slot.uuid]: texB.uuid },
			}
		}, BLUEPRINT_FORMAT_ID)

		expect(result.json.display_name).toBe('Red')
		expect(result.json.slot_textures).toEqual(result.expectedSlotTextures)
		expect(result.json.on_apply_function).toBe('test:on_apply')
		expect(result.restoredDisplayName).toBe('Red')
		expect(result.restoredSlotTexture).toBe(true)
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

			const slot = aj.textureSlots.createTextureSlot([texA, texB])
			const red = new aj.Variant('Red')
			red.slotTextures.set(slot.uuid, texB.uuid)

			const blue = new aj.Variant('Blue')
			blue.onApplyFunction = 'test:blue'
			blue.excludedNodes = new Set([bone.uuid])

			const compiled = codec.compile({ raw: true, bitmaps: false })
			g.newProject(g.Formats[formatId])
			codec.parse(compiled, 'variants.ajblueprint')

			const all = aj.Variant.all as any[]
			const byName = (n: string) => all.find(v => v.displayName === n)
			return {
				names: all.map(v => v.displayName).sort(),
				defaultCount: all.filter(v => v.isDefault).length,
				redHasMapping: byName('Red')?.slotTextures.get(slot.uuid) === texB.uuid,
				blueOnApply: byName('Blue')?.onApplyFunction,
				blueExcludes: byName('Blue')?.excludedNodes.size,
			}
		}, BLUEPRINT_FORMAT_ID)

		expect(result.names).toEqual(['Blue', 'Default', 'Red'])
		expect(result.defaultCount).toBe(1)
		expect(result.redHasMapping).toBe(true)
		expect(result.blueOnApply).toBe('test:blue')
		expect(result.blueExcludes).toBe(1)
	})

	it('keeps a renamed default Variant, its on_apply, and custom names through the codec', async () => {
		const result = await blockbench.evaluate((formatId: string) => {
			const aj = (window as any).AnimatedJava
			const codec = aj.BLUEPRINT_CODEC.get()
			const g = globalThis as any
			g.newProject(g.Formats[formatId])

			const def = aj.Variant.getDefault()
			def.displayName = 'Base Look'
			def.name = 'base_look'
			def.onApplyFunction = 'say base'

			const red = new aj.Variant('Red Team')
			red.generateNameFromDisplayName = false
			red.name = 'team_red'

			const compiled = codec.compile({ raw: true, bitmaps: false })
			g.newProject(g.Formats[formatId])
			codec.parse(compiled, 'variants.ajblueprint')

			const loadedDefault = aj.Variant.getDefault()
			const loadedRed = aj.Variant.all.find((v: any) => v.displayName === 'Red Team')
			return {
				defaultDisplayName: loadedDefault.displayName,
				defaultName: loadedDefault.name,
				defaultOnApply: loadedDefault.onApplyFunction,
				defaultGeneratesName: loadedDefault.generateNameFromDisplayName,
				redName: loadedRed?.name,
				redGeneratesName: loadedRed?.generateNameFromDisplayName,
				defaultCount: aj.Variant.all.filter((v: any) => v.isDefault).length,
			}
		}, BLUEPRINT_FORMAT_ID)

		expect(result).toEqual({
			defaultDisplayName: 'Base Look',
			defaultName: 'base_look',
			defaultOnApply: 'say base',
			defaultGeneratesName: true,
			redName: 'team_red',
			redGeneratesName: false,
			defaultCount: 1,
		})
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

	it('verifySlotTextures prunes choices for missing slots and textures', async () => {
		const result = await blockbench.evaluate((formatId: string) => {
			const aj = (window as any).AnimatedJava
			const g = globalThis as any
			g.newProject(g.Formats[formatId])

			const texA = new Texture({ name: 'a.png' }, undefined).add(false)
			const texB = new Texture({ name: 'b.png' }, undefined).add(false)
			const kept = aj.textureSlots.createTextureSlot([texA, texB])
			kept.name = 'kept'
			const pruned = aj.textureSlots.createTextureSlot([texA])
			pruned.name = 'pruned'

			const variant = new aj.Variant('V')
			variant.slotTextures.set(kept.uuid, texB.uuid)
			variant.slotTextures.set(pruned.uuid, texB.uuid)
			variant.slotTextures.set('missing-slot', texA.uuid)
			variant.verifySlotTextures()

			return [...variant.slotTextures.keys()].map(
				uuid => aj.textureSlots.getTextureSlot(uuid)?.name
			)
		}, BLUEPRINT_FORMAT_ID)

		expect(result).toEqual(['kept'])
	})

	it('selecting a Variant previews its slot textures, except on excluded bones', async () => {
		const result = await blockbench.evaluate((formatId: string) => {
			const aj = (window as any).AnimatedJava
			const g = globalThis as any
			g.newProject(g.Formats[formatId])

			const red = new Texture({ name: 'red.png' }, undefined).add(false)
			const blue = new Texture({ name: 'blue.png' }, undefined).add(false)
			const makeCube = (boneName: string) => {
				const bone = new Group({ name: boneName }).init()
				const cube = new Cube({ from: [0, 0, 0], to: [4, 4, 4] }).addTo(bone).init()
				for (const face of Object.values(cube.faces) as any[]) face.texture = red.uuid
				return { bone, cube }
			}
			const included = makeCube('included')
			const excluded = makeCube('excluded')

			const slot = aj.textureSlots.createTextureSlot([red, blue])
			included.cube.faces.north.texture = slot.uuid
			excluded.cube.faces.north.texture = slot.uuid

			const variant = new aj.Variant('Blue')
			variant.slotTextures.set(slot.uuid, blue.uuid)
			variant.excludedNodes = new Set([excluded.bone.uuid])

			const nameOf = (face: CubeFace) => (face.getTexture() as Texture)?.name
			variant.select()
			const selected = {
				included: nameOf(included.cube.faces.north),
				excluded: nameOf(excluded.cube.faces.north),
				unslotted: nameOf(included.cube.faces.south),
			}
			aj.Variant.selectDefault()
			const afterDefault = nameOf(included.cube.faces.north)

			return { selected, afterDefault }
		}, BLUEPRINT_FORMAT_ID)

		expect(result.selected).toEqual({
			included: 'blue.png',
			excluded: 'red.png',
			unslotted: 'red.png',
		})
		expect(result.afterDefault).toBe('red.png')
	})

	it('renderRig bakes slot textures into per-Variant bone models', async () => {
		const result = await blockbench.evaluate(
			(args: { formatId: string; modelFolder: string; textureFolder: string }) => {
				const aj = (window as any).AnimatedJava
				const g = globalThis as any
				g.newProject(g.Formats[args.formatId])

				const red = new Texture({ name: 'red.png' }, undefined).add(false)
				const blue = new Texture({ name: 'blue.png' }, undefined).add(false)
				const slot = aj.textureSlots.createTextureSlot([red, blue])
				slot.name = 'shirt'
				const makeBone = (name: string, slotted: boolean) => {
					const bone = new Group({ name }).init()
					const cube = new Cube({ from: [0, 0, 0], to: [4, 4, 4] }).addTo(bone).init()
					for (const face of Object.values(cube.faces) as any[]) face.texture = red.uuid
					if (slotted) cube.faces.north.texture = slot.uuid
					return bone
				}
				const slottedBone = makeBone('slotted', true)
				const plainBone = makeBone('plain', false)

				const variant = new aj.Variant('Blue')
				variant.slotTextures.set(slot.uuid, blue.uuid)

				// 1.21.4+ switches slots instead of baking Variant models
				Project.animated_java.target_minecraft_version = '1.21.4'
				const modernRig = aj.renderRig(args.modelFolder, args.textureFolder)
				Project.animated_java.target_minecraft_version = '1.20.4'
				const rig = aj.renderRig(args.modelFolder, args.textureFolder)
				const defaultModel =
					rig.variants[aj.Variant.getDefault().uuid].models[slottedBone.uuid]
				const variantModels = rig.variants[variant.uuid].models
				return {
					slot: rig.texture_slots[slot.uuid],
					textureIds: [red.id, blue.id],
					slottedBoneUuid: slottedBone.uuid,
					northTexture: defaultModel.model.elements[0].faces.north.texture,
					southTexture: defaultModel.model.elements[0].faces.south.texture,
					defaultSlotTexture: defaultModel.model.textures.slot_shirt,
					variantSlotTexture: variantModels[slottedBone.uuid].model?.textures,
					plainBoneUsesDefault: variantModels[plainBone.uuid].model === null,
					modernVariantModels: modernRig.variants[variant.uuid].models,
				}
			},
			{
				formatId: BLUEPRINT_FORMAT_ID,
				modelFolder: MODEL_FOLDER,
				textureFolder: TEXTURE_FOLDER,
			}
		)

		expect(result.slot).toEqual({
			name: 'shirt',
			index: 0,
			textures: [
				{ id: result.textureIds[0], name: 'red' },
				{ id: result.textureIds[1], name: 'blue' },
			],
			bones: [result.slottedBoneUuid],
		})
		expect(result.northTexture).toBe('#slot_shirt')
		expect(result.southTexture).toBe('#' + result.textureIds[0])
		expect(result.defaultSlotTexture).toBe('aj:blueprint/test/red')
		expect(result.variantSlotTexture).toEqual({ slot_shirt: 'aj:blueprint/test/blue' })
		expect(result.plainBoneUsesDefault).toBe(true)
		expect(result.modernVariantModels).toEqual({})
	})
})
