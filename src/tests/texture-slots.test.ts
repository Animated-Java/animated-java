import { describe, expect, it } from '@jest/globals'
import { blockbench } from '@snavesutit/jestbench'
import * as path from 'node:path'

const BLUEPRINT_FORMAT_ID = 'animated-java:format/blueprint'

/**
 * `src/textureSlots.ts` - a Texture Slot is a Texture (`is_texture_slot`) that references other
 * textures (`slot_textures`, the first is the default). Faces use a slot like any texture, and show
 * whichever of its textures the slot previews.
 */
describe('Texture Slots', () => {
	it('creates a slot texture that faces resolve to its previewed texture', async () => {
		const result = await blockbench.evaluate((formatId: string) => {
			const slots = (window as any).AnimatedJava.textureSlots
			const g = globalThis as any
			g.newProject(g.Formats[formatId])

			const red = new Texture({ name: 'red.png' }, undefined).add(false)
			const blue = new Texture({ name: 'blue.png' }, undefined).add(false)
			const bone = new Group({ name: 'bone' }).init()
			const cube = new Cube({ name: 'c', from: [0, 0, 0], to: [4, 4, 4] }).addTo(bone).init()
			for (const face of Object.values(cube.faces) as any[]) face.texture = red.uuid

			const slot = slots.createTextureSlot([red, blue])
			cube.faces.north.texture = slot.uuid
			const nameOf = (face: CubeFace) => (face.getTexture() as Texture)?.name

			const defaultNorth = nameOf(cube.faces.north)
			slots.previewSlotTexture(slot, blue.uuid)
			const previewNorth = nameOf(cube.faces.north)
			const previewSouth = nameOf(cube.faces.south)
			const paintTarget = Painter.getTextureToEdit(slot)?.name

			const redInTwoSlots = slots.createTextureSlot([red]).slot_textures.includes(red.uuid)

			Undo.undo()
			Undo.undo()
			const afterUndo = slots.getTextureSlots().length

			return {
				isSlot: slots.isTextureSlot(slot),
				slotTextures: slot.slot_textures,
				expected: [red.uuid, blue.uuid],
				defaultNorth,
				previewNorth,
				previewSouth,
				paintTarget,
				redInTwoSlots,
				afterUndo,
			}
		}, BLUEPRINT_FORMAT_ID)

		expect(result.isSlot).toBe(true)
		expect(result.slotTextures).toEqual(result.expected)
		expect(result.defaultNorth).toBe('red.png')
		expect(result.previewNorth).toBe('blue.png')
		expect(result.previewSouth).toBe('red.png')
		expect(result.paintTarget).toBe('blue.png')
		expect(result.redInTwoSlots).toBe(true)
		expect(result.afterUndo).toBe(0)
	})

	it('gives slots their own context menu without image-editing actions', async () => {
		const result = await blockbench.evaluate((formatId: string) => {
			const slots = (window as any).AnimatedJava.textureSlots
			const g = globalThis as any
			g.newProject(g.Formats[formatId])

			const red = new Texture({ name: 'red.png' }, undefined).add(false)
			const slot = slots.createTextureSlot([red])
			const entries = (menu: any) =>
				menu.structure.map((item: any) => (typeof item === 'string' ? item : item.name))

			slot.showContextMenu(new MouseEvent('contextmenu', { clientX: 10, clientY: 10 }))
			const slotMenu = entries(Menu.open)
			Menu.open?.hide()
			red.showContextMenu(new MouseEvent('contextmenu', { clientX: 10, clientY: 10 }))
			const textureMenu = entries(Menu.open)
			Menu.open?.hide()
			return { slotMenu, textureMenu }
		}, BLUEPRINT_FORMAT_ID)

		expect(result.slotMenu).toEqual(
			expect.arrayContaining(['menu.texture.face', 'duplicate', 'delete'])
		)
		expect(result.slotMenu).not.toContain('resize_texture')
		expect(result.slotMenu).not.toContain('menu.texture.export')
		expect(result.textureMenu).toContain('resize_texture')
	})

	it('deleting a slot moves its faces to the default texture, undoably', async () => {
		const result = await blockbench.evaluate((formatId: string) => {
			const slots = (window as any).AnimatedJava.textureSlots
			const g = globalThis as any
			g.newProject(g.Formats[formatId])

			const red = new Texture({ name: 'red.png' }, undefined).add(false)
			const blue = new Texture({ name: 'blue.png' }, undefined).add(false)
			const bone = new Group({ name: 'bone' }).init()
			const cube = new Cube({ name: 'c', from: [0, 0, 0], to: [4, 4, 4] }).addTo(bone).init()
			const slot = slots.createTextureSlot([blue, red])
			for (const face of Object.values(cube.faces) as any[]) face.texture = slot.uuid

			unselectTextures()
			slot.select()
			Prop.active_panel = 'textures'
			SharedActions.run('delete')
			const afterDelete = {
				slotGone: !Texture.all.includes(slot),
				north: cube.faces.north.texture === blue.uuid,
			}
			Undo.undo()
			const afterUndo = {
				slotBack: Texture.all.some(t => t.uuid === slot.uuid),
				north: cube.faces.north.texture === slot.uuid,
			}
			return { afterDelete, afterUndo }
		}, BLUEPRINT_FORMAT_ID)

		expect(result.afterDelete).toEqual({ slotGone: true, north: true })
		expect(result.afterUndo).toEqual({ slotBack: true, north: true })
	})

	it("copies a file texture's image, not its canvas, into the slot icon", async () => {
		const file = path.resolve(process.cwd(), 'src/assets/missing_texture.png')
		const result = await blockbench.evaluate(
			async (args: { formatId: string; file: string }) => {
				const slots = (window as any).AnimatedJava.textureSlots
				const g = globalThis as any
				g.newProject(g.Formats[args.formatId])

				const texture = new Texture({ name: 'file.png' }).fromPath(args.file).add(false)
				const waitFor = (check: () => boolean) =>
					new Promise<void>(resolve => {
						const poll = () => (check() ? resolve() : setTimeout(poll, 50))
						poll()
					})
				await waitFor(() => texture.img.complete && texture.img.naturalWidth > 0)

				// Right after a project opens, the image has loaded but the texture's canvas can
				// still be blank. The slot must copy the image, not the canvas.
				texture.ctx.clearRect(0, 0, texture.canvas.width, texture.canvas.height)
				const slot = slots.createTextureSlot([texture])
				slots.updateSlotImage(slot)
				await waitFor(
					() =>
						slot.source?.startsWith('data:') &&
						slot.img.complete &&
						slot.img.naturalWidth > 0
				)
				const image = slot.img

				const canvas = document.createElement('canvas')
				canvas.width = image.naturalWidth
				canvas.height = image.naturalHeight
				const ctx = canvas.getContext('2d')!
				ctx.drawImage(image, 0, 0)
				const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data
				let opaque = 0
				for (let i = 3; i < pixels.length; i += 4) if (pixels[i] > 0) opaque++
				return { width: canvas.width, opaque, mode: texture.mode }
			},
			{ formatId: BLUEPRINT_FORMAT_ID, file }
		)

		expect(result.mode).toBe('link')
		expect(result.width).toBeGreaterThan(0)
		expect(result.opaque).toBeGreaterThan(0)
	})

	it('saves faces with the slot, not its preview, and round-trips through the codec', async () => {
		const result = await blockbench.evaluate((formatId: string) => {
			const aj = (window as any).AnimatedJava
			const slots = aj.textureSlots
			const codec = aj.BLUEPRINT_CODEC.get()
			const g = globalThis as any
			g.newProject(g.Formats[formatId])

			const red = new Texture({ name: 'red.png' }, undefined).add(false)
			const blue = new Texture({ name: 'blue.png' }, undefined).add(false)
			const bone = new Group({ name: 'bone' }).init()
			const cube = new Cube({ name: 'c', from: [0, 0, 0], to: [4, 4, 4] }).addTo(bone).init()
			for (const face of Object.values(cube.faces) as any[]) face.texture = red.uuid
			const slot = slots.createTextureSlot([red, blue])
			cube.faces.up.texture = slot.uuid
			slots.previewSlotTexture(slot, blue.uuid)

			const compiled = codec.compile({ raw: true, bitmaps: false })
			const previewAfterCompile = (cube.faces.up.getTexture() as Texture)?.name
			const savedSlot = compiled.textures.find((t: any) => t.uuid === slot.uuid)

			g.newProject(g.Formats[formatId])
			codec.parse(compiled, 'slots.ajblueprint')
			const loadedSlot = slots.getTextureSlot(slot.uuid)
			const loadedCube = Cube.all[0]

			return {
				savedUp: compiled.elements[0].faces.up.texture === slot.uuid,
				savedSlot: {
					is_texture_slot: savedSlot?.is_texture_slot,
					slot_textures: savedSlot?.slot_textures,
					hasSource: 'source' in (savedSlot ?? {}),
				},
				expectedTextures: [red.uuid, blue.uuid],
				previewAfterCompile,
				loadedTextures: loadedSlot?.slot_textures,
				loadedUp: (loadedCube?.faces.up.getTexture() as Texture)?.name,
			}
		}, BLUEPRINT_FORMAT_ID)

		expect(result.savedUp).toBe(true)
		expect(result.savedSlot).toEqual({
			is_texture_slot: true,
			slot_textures: result.expectedTextures,
			hasSource: false,
		})
		expect(result.previewAfterCompile).toBe('blue.png')
		expect(result.loadedTextures).toEqual(result.expectedTextures)
		expect(result.loadedUp).toBe('red.png')
	})
})
