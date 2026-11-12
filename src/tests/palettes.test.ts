import { afterAll, describe, expect, it } from '@jest/globals'
import { blockbench } from '@snavesutit/jestbench'
import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'

const BLUEPRINT_FORMAT_ID = 'animated-java:format/blueprint'
const WORK_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'aj-palettes-'))

/**
 * Builds a project in Blockbench with a 2x1 base texture (#e0e0e0, #808080), a Permutation Set
 * recoloring it gold and red, and a bone whose cube uses the gold recolor. The setup's source is
 * shipped to Blockbench, so it can't close over anything.
 */
const SETUP = `(formatId) => {
	const g = globalThis
	g.newProject(g.Formats[formatId])
	const palettes = window.AnimatedJava.palettes

	const canvas = document.createElement('canvas')
	canvas.width = 2
	canvas.height = 1
	const ctx = canvas.getContext('2d')
	ctx.fillStyle = '#e0e0e0'
	ctx.fillRect(0, 0, 1, 1)
	ctx.fillStyle = '#808080'
	ctx.fillRect(1, 0, 1, 1)
	const base = new Texture({ name: 'armor.png' }).fromDataURL(canvas.toDataURL()).add(false)

	const set = palettes.createPaletteSet('armor_colors', palettes.createSetData({
		bases: [base.uuid],
		key: { colors: ['#e0e0e0ff', '#808080ff'] },
		permutations: [
			{ uuid: 'gold', suffix: 'gold', strip: { colors: ['#ffff00ff', '#aa8800ff'] } },
			{ uuid: 'red', suffix: 'red', strip: { colors: ['#ff0000ff', '#880000ff'] } },
		],
	}))
	const gold = palettes.getGeneratedTextures(set).find(t => t.palette_generated.permutation === 'gold')
	const bone = new Group({ name: 'bone' }).init()
	const cube = new Cube({ name: 'cube', from: [0, 0, 0], to: [2, 1, 1] }).addTo(bone).init()
	for (const face of Object.values(cube.faces)) face.texture = gold.uuid
	return { palettes, base, set, gold, bone, cube }
}`

/** Reads a generated texture's pixels as `#rrggbbaa` strings. */
const READ_PIXELS = `async (texture) => {
	await new Promise(resolve => texture.img.complete && texture.img.naturalWidth ? resolve() : texture.img.addEventListener('load', resolve, { once: true }))
	const canvas = document.createElement('canvas')
	canvas.width = texture.img.naturalWidth
	canvas.height = texture.img.naturalHeight
	const ctx = canvas.getContext('2d')
	ctx.drawImage(texture.img, 0, 0)
	const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data
	const out = []
	for (let i = 0; i < data.length; i += 4) out.push('#' + [...data.slice(i, i + 4)].map(v => v.toString(16).padStart(2, '0')).join(''))
	return out
}`

/**
 * Drag helpers for svelte-dnd-action, which drags on mouse events: `lift` presses `from` and moves
 * just past `to`, `drop` lets go, and `drag` does both.
 */
const DRAG = `() => {
	const wait = (ms = 50) => new Promise(resolve => setTimeout(resolve, ms))
	const center = element => {
		const rect = element.getBoundingClientRect()
		return [rect.left + rect.width / 2, rect.top + rect.height / 2]
	}
	const lift = async (from, to) => {
		const [x0, y0] = center(from)
		const [x1, y1] = center(to)
		const dx = Math.sign(x1 - x0) * 6
		const dy = Math.sign(y1 - y0) * 6
		// Press whatever is under the cursor, as a user would, not the drag item itself.
		document
			.elementFromPoint(x0, y0)
			.dispatchEvent(new MouseEvent('mousedown', { clientX: x0, clientY: y0, bubbles: true }))
		for (let step = 1; step <= 20; step++) {
			window.dispatchEvent(
				new MouseEvent('mousemove', {
					clientX: x0 + ((x1 + dx - x0) * step) / 20,
					clientY: y0 + ((y1 + dy - y0) * step) / 20,
					buttons: 1,
				})
			)
			await wait(30)
		}
		// The library checks the dragged element's position on an interval.
		await wait(400)
	}
	const drop = async () => {
		window.dispatchEvent(new MouseEvent('mouseup'))
		await wait(500)
	}
	const drag = async (from, to) => {
		await lift(from, to)
		await drop()
	}
	return { lift, drop, drag }
}`

describe('Permutation Sets', () => {
	afterAll(() => fs.rmSync(WORK_DIR, { recursive: true, force: true }))

	it("generates a recolored texture per base and permutation in the set's group, as one undo step", async () => {
		const result = await blockbench.evaluate(
			async (args: { setup: string; readPixels: string; formatId: string }) => {
				const { palettes, set, gold } = new Function(`return ${args.setup}`)()(
					args.formatId
				)
				const readPixels = new Function(`return ${args.readPixels}`)()
				await palettes.regenerateAllSets()
				const generated = palettes.getGeneratedTextures(set)
				const names = generated.map((t: Texture) => t.name)
				const order = Texture.all.map(t => t.name)
				const inGroup = generated.every((t: Texture) => t.group === set.uuid)
				const isGroup = TextureGroup.all.includes(set)
				const goldPixels = await readPixels(gold)

				Undo.undo() // the cube
				Undo.undo() // the bone
				Undo.undo() // the set
				const afterUndo = {
					sets: palettes.getPaletteSets().length,
					generated: Texture.all.filter((t: Texture) => palettes.isGeneratedTexture(t))
						.length,
					groups: TextureGroup.all.length,
				}
				return { names, order, inGroup, isGroup, goldPixels, afterUndo }
			},
			{ setup: SETUP, readPixels: READ_PIXELS, formatId: BLUEPRINT_FORMAT_ID }
		)

		expect(result.names).toEqual(['armor_gold', 'armor_red'])
		expect(result.order).toEqual(['armor.png', 'armor_gold', 'armor_red'])
		expect(result.inGroup).toBe(true)
		expect(result.isGroup).toBe(true)
		expect(result.goldPixels).toEqual(['#ffff00ff', '#aa8800ff'])
		expect(result.afterUndo).toEqual({ sets: 0, generated: 0, groups: 0 })
	})

	it('paints the base when painting a generated texture', async () => {
		const result = await blockbench.evaluate(
			(args: { setup: string; formatId: string }) => {
				const { gold } = new Function(`return ${args.setup}`)()(args.formatId)
				return Painter.getTextureToEdit(gold)?.name
			},
			{ setup: SETUP, formatId: BLUEPRINT_FORMAT_ID }
		)
		expect(result).toBe('armor.png')
	})

	it('syncs generated textures when permutations change, moving orphaned faces to the base', async () => {
		const result = await blockbench.evaluate(
			(args: { setup: string; formatId: string }) => {
				const { palettes, base, set, cube } = new Function(`return ${args.setup}`)()(
					args.formatId
				)
				const data = structuredClone(set.palette_set)
				data.permutations = data.permutations.filter((p: any) => p.uuid !== 'gold')
				data.permutations[0].suffix = 'crimson'
				palettes.editPaletteSet(set, data)
				const names = palettes.getGeneratedTextures(set).map((t: Texture) => t.name)
				const faceOnBase = cube.faces.north.texture === base.uuid
				Undo.undo()
				const restored = palettes.getGeneratedTextures(set).map((t: Texture) => t.name)
				return { names, faceOnBase, restored }
			},
			{ setup: SETUP, formatId: BLUEPRINT_FORMAT_ID }
		)
		expect(result.names).toEqual(['armor_crimson'])
		expect(result.faceOnBase).toBe(true)
		expect(result.restored).toEqual(['armor_gold', 'armor_red'])
	})

	it("removes a base's recolors with it, and drops it from the set", async () => {
		const result = await blockbench.evaluate(
			(args: { setup: string; formatId: string }) => {
				const { palettes, base, set, cube } = new Function(`return ${args.setup}`)()(
					args.formatId
				)
				base.select()
				Prop.active_panel = 'textures'
				SharedActions.run('delete')
				return {
					bases: set.palette_set.bases.length,
					generated: palettes.getGeneratedTextures(set).length,
					face: cube.faces.north.texture,
				}
			},
			{ setup: SETUP, formatId: BLUEPRINT_FORMAT_ID }
		)
		expect(result).toEqual({ bases: 0, generated: 0, face: false })
	})

	it('saves and loads sets, regenerating their images', async () => {
		const result = await blockbench.evaluate(
			async (args: { setup: string; readPixels: string; formatId: string }) => {
				new Function(`return ${args.setup}`)()(args.formatId)
				const readPixels = new Function(`return ${args.readPixels}`)()
				const aj = (window as any).AnimatedJava
				const codec = aj.BLUEPRINT_CODEC.get()
				const saved = codec.compile({ raw: true })
				const savedSet = saved.texture_groups.find((g: any) => g.palette_set?.permutations)
				const savedGold = saved.textures.find((t: any) => t.name === 'armor_gold')

				const g = globalThis as any
				g.newProject(g.Formats[args.formatId])
				codec.load(saved, { name: 'roundtrip.ajblueprint', path: '', no_file: true })
				await new Promise(resolve => setTimeout(resolve, 100))
				await aj.palettes.regenerateAllSets()
				const gold = Texture.all.find(t => t.name === 'armor_gold')!
				const loadedSet = aj.palettes.getPaletteSets()[0]
				return {
					setName: savedSet?.name,
					loadedInGroup: gold.group === loadedSet?.uuid,
					goldHasSource: 'source' in savedGold,
					goldGenerated: savedGold.palette_generated,
					goldPixels: await readPixels(gold),
				}
			},
			{ setup: SETUP, readPixels: READ_PIXELS, formatId: BLUEPRINT_FORMAT_ID }
		)
		expect(result.setName).toBe('armor_colors')
		expect(result.loadedInGroup).toBe(true)
		expect(result.goldHasSource).toBe(false)
		expect(result.goldGenerated).toMatchObject({ permutation: 'gold' })
		expect(result.goldPixels).toEqual(['#ffff00ff', '#aa8800ff'])
	})

	it("keeps a set's group holding exactly its recolors", async () => {
		const result = await blockbench.evaluate(
			(args: { setup: string; formatId: string }) => {
				const { base, set, gold } = new Function(`return ${args.setup}`)()(args.formatId)
				const messages: string[] = []
				const showQuickMessage = Blockbench.showQuickMessage
				Blockbench.showQuickMessage = (message: string) => void messages.push(message)
				try {
					// Like dragging textures in the panel: a "Rearrange textures" edit.
					Undo.initEdit({ textures: [base, gold] })
					base.group = set.uuid
					gold.group = ''
					Undo.finishEdit('Rearrange textures')
				} finally {
					Blockbench.showQuickMessage = showQuickMessage
				}
				return {
					base: base.group,
					gold: gold.group === set.uuid,
					messages: messages.length,
				}
			},
			{ setup: SETUP, formatId: BLUEPRINT_FORMAT_ID }
		)
		expect(result).toEqual({ base: '', gold: true, messages: 1 })
	})

	it('deletes a set with its recolors in one undo step, but not a recolor on its own', async () => {
		const result = await blockbench.evaluate(
			(args: { setup: string; formatId: string }) => {
				const { palettes, base, set, gold, cube } = new Function(`return ${args.setup}`)()(
					args.formatId
				)
				gold.select()
				Prop.active_panel = 'textures'
				SharedActions.run('delete')
				const goldKept = Texture.all.includes(gold)

				palettes.removeTextures([], [set])
				const deleted = {
					groups: TextureGroup.all.length,
					generated: Texture.all.filter((t: Texture) => palettes.isGeneratedTexture(t))
						.length,
					faceOnBase: cube.faces.north.texture === base.uuid,
				}
				Undo.undo()
				const restored = palettes.getPaletteSets()[0]
				return {
					goldKept,
					deleted,
					restored: {
						name: restored?.name,
						permutations: restored?.palette_set.permutations.length,
						generated: restored ? palettes.getGeneratedTextures(restored).length : 0,
						face: cube.faces.north.texture === gold.uuid,
					},
				}
			},
			{ setup: SETUP, formatId: BLUEPRINT_FORMAT_ID }
		)
		expect(result).toEqual({
			goldKept: true,
			deleted: { groups: 0, generated: 0, faceOnBase: true },
			restored: { name: 'armor_colors', permutations: 2, generated: 2, face: true },
		})
	})

	it("keeps recolors' panel icons after their set's group unfolds", async () => {
		const icons = await blockbench.evaluate(async (formatId: string) => {
			const g = globalThis as any
			g.newProject(g.Formats[formatId])
			const palettes = (window as any).AnimatedJava.palettes
			const base = new Texture({ name: 'base.png' }).add(false)
			const permutations = Array.from({ length: 16 }, (_, i) => ({
				uuid: `p${i}`,
				suffix: `p${i}`,
				strip: { colors: [] },
			}))
			const set = palettes.createPaletteSet(
				'many',
				palettes.createSetData({ bases: [base.uuid], permutations })
			)
			const frames = () =>
				new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))
			await frames()
			set.folded = false
			await frames()
			await frames()
			return palettes
				.getGeneratedTextures(set)
				.map(
					(t: Texture) =>
						document.querySelector(`li[texid="${t.uuid}"] .texture_save_icon`)
							?.textContent
				)
		}, BLUEPRINT_FORMAT_ID)
		expect(icons).toHaveLength(16)
		expect(new Set(icons)).toEqual(new Set(['colorize']))
	})

	it('folds sets with many recolors', async () => {
		const folded = await blockbench.evaluate((formatId: string) => {
			const g = globalThis as any
			g.newProject(g.Formats[formatId])
			const palettes = (window as any).AnimatedJava.palettes
			const base = new Texture({ name: 'base.png' }).add(false)
			const permutations = Array.from({ length: 16 }, (_, i) => ({
				uuid: `p${i}`,
				suffix: `p${i}`,
				strip: { colors: [] },
			}))
			const many = palettes.createPaletteSet(
				'many',
				palettes.createSetData({ bases: [base.uuid], permutations })
			)
			const few = palettes.createPaletteSet(
				'few',
				palettes.createSetData({
					bases: [base.uuid],
					permutations: permutations.slice(0, 2),
				})
			)
			return { many: many.folded, few: few.folded }
		}, BLUEPRINT_FORMAT_ID)
		expect(folded).toEqual({ many: true, few: false })
	})

	it('removes a base deleted together with a Texture Slot, in one undo step', async () => {
		const result = await blockbench.evaluate(
			(args: { setup: string; formatId: string }) => {
				const { palettes, base, set, gold, cube } = new Function(`return ${args.setup}`)()(
					args.formatId
				)
				const slots = (window as any).AnimatedJava.textureSlots
				const slot = slots.createTextureSlot([gold])
				cube.faces.up.texture = slot.uuid
				slot.select()
				base.select(new MouseEvent('click', { ctrlKey: true }))
				Prop.active_panel = 'textures'
				const selected = Texture.all.filter(t => t.selected || t.multi_selected).length
				SharedActions.run('delete')
				const after = {
					selected,
					generated: palettes.getGeneratedTextures(set).length,
					bases: set.palette_set.bases.length,
					up: cube.faces.up.texture,
					north: cube.faces.north.texture,
				}
				Undo.undo()
				return {
					...after,
					restored: palettes.getGeneratedTextures(set).length,
					restoredUp: cube.faces.up.texture === slot.uuid,
				}
			},
			{ setup: SETUP, formatId: BLUEPRINT_FORMAT_ID }
		)
		expect(result).toEqual({
			selected: 2,
			generated: 0,
			bases: 0,
			up: false,
			north: false,
			restored: 2,
			restoredUp: true,
		})
	})

	it('removes a key color from the key and every palette that lines up with it', async () => {
		const result = await blockbench.evaluate(
			async (args: { setup: string; formatId: string }) => {
				const { set } = new Function(`return ${args.setup}`)()(args.formatId)
				// Double-clicking the set's group header calls select()
				set.select()
				const root = document.querySelector('#animated_java\\:palette_set')!
				const swatch = root.querySelector<HTMLElement>('.key-swatches .key-swatch')!
				// In the dialog, left-click only starts drags; right-click edits.
				swatch.click()
				await new Promise(resolve => setTimeout(resolve, 50))
				const leftClickOpens = !!document.querySelector('.swatch-popover')
				swatch.dispatchEvent(
					new MouseEvent('contextmenu', { bubbles: true, cancelable: true })
				)
				await new Promise(resolve => setTimeout(resolve, 50))
				const action = [
					...document.querySelectorAll<HTMLElement>('.swatch-popover button.action'),
				].find(button => button.textContent?.includes('Remove color from key'))!
				action.click()
				await new Promise(resolve => setTimeout(resolve, 50))
				Dialog.open!.confirm()
				return {
					leftClickOpens,
					key: set.palette_set.key.colors,
					gold: set.palette_set.permutations[0].strip.colors,
				}
			},
			{ setup: SETUP, formatId: BLUEPRINT_FORMAT_ID }
		)
		expect(result).toEqual({ leftClickOpens: false, key: ['#808080ff'], gold: ['#aa8800ff'] })
	})

	it('reorders key columns, a palette, permutations and bases by dragging', async () => {
		const result = await blockbench.evaluate(
			async (args: { setup: string; formatId: string; drag: string }) => {
				const { palettes, set, base } = new Function(`return ${args.setup}`)()(
					args.formatId
				)
				const wait = (ms = 50) => new Promise(resolve => setTimeout(resolve, ms))
				const second = new Texture({ name: 'second.png' })
					.fromDataURL(base.source)
					.add(false)
				const data = structuredClone(set.palette_set)
				data.bases.push(second.uuid)
				data.permutations.push({
					uuid: 'pack',
					suffix: 'pack',
					strip: { id: 'minecraft:trims/color_palettes/gold' },
				})
				palettes.editPaletteSet(set, data)
				set.select()
				await wait(300)
				const root = document.querySelector('#animated_java\\:palette_set')!
				const items = (selector: string) => [
					...root.querySelectorAll<HTMLElement>(selector),
				]
				const paletteItems = () => items('.lineup-row:last-child .swatch-item')
				const { lift, drop, drag } = new Function(`return ${args.drag}`)()()
				const backgrounds = (elements: Element[]) =>
					elements.map(element => (element as HTMLElement).style.background)

				// A key color drags its whole column: the arrow and gold color under it travel with
				// it, leaving a gap, and gold and red follow it on drop.
				const keyItems = () => items('.lineup-row:first-child .swatch-item')
				await lift(keyItems()[0], keyItems()[1])
				const ghost = document.getElementById('dnd-action-dragged-el')!
				const midDrag = {
					ghost: [...ghost.children].map(child =>
						['key-swatch', 'arrow', 'palette-swatch'].find(name =>
							child.classList.contains(name)
						)
					),
					ghostPalette: backgrounds([ghost.querySelector('.palette-swatch')!]),
					gaps: items('.lifted').length,
					palette: backgrounds(items('.lineup-row:last-child .palette-swatch')),
				}
				await drop()
				// A palette color only reorders the selected palette, gold.
				await drag(paletteItems()[0], paletteItems()[1])
				await drag(items('.list.bases li')[0], items('.list.bases li')[1])
				// A pack palette can't be reordered in place.
				items('.permutations .row')[2].click()
				await wait(300)
				const packSwatches = paletteItems().length
				await drag(paletteItems()[0], paletteItems()[1])
				await drag(items('.list.permutations li')[0], items('.list.permutations li')[1])

				// Swatches and rows aren't real buttons, so they handle Enter and Space themselves.
				const swatch = root.querySelector<HTMLElement>('.key-swatches .key-swatch')!
				swatch.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
				await wait(300)
				const enterOpensPopover = !!document.querySelector('.swatch-popover')
				window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
				await wait()
				const row = items('.permutations .row')[1]
				row.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }))
				await wait()
				const spaceSelectsRow = row.classList.contains('selected')

				Dialog.open!.confirm()
				return {
					midDrag,
					enterOpensPopover,
					spaceSelectsRow,
					packSwatches: packSwatches > 1,
					key: set.palette_set.key.colors,
					permutations: set.palette_set.permutations.map(
						(p: { suffix: string; strip: unknown }) => [p.suffix, p.strip]
					),
					bases: set.palette_set.bases.map(
						(uuid: string) => Texture.all.find(t => t.uuid === uuid)?.name
					),
				}
			},
			{ setup: SETUP, formatId: BLUEPRINT_FORMAT_ID, drag: DRAG }
		)
		expect(result).toEqual({
			midDrag: {
				ghost: ['key-swatch', 'arrow', 'palette-swatch'],
				ghostPalette: ['rgb(255, 255, 0)'],
				gaps: 2,
				palette: ['rgb(170, 136, 0)', 'rgb(255, 255, 0)'],
			},
			enterOpensPopover: true,
			spaceSelectsRow: true,
			packSwatches: true,
			key: ['#808080ff', '#e0e0e0ff'],
			permutations: [
				['red', { colors: ['#880000ff', '#ff0000ff'] }],
				['gold', { colors: ['#ffff00ff', '#aa8800ff'] }],
				['pack', { id: 'minecraft:trims/color_palettes/gold' }],
			],
			bases: ['second.png', 'armor.png'],
		})
	})

	it('edits palette colors in a popover under the swatch', async () => {
		const result = await blockbench.evaluate(
			async (args: { setup: string; formatId: string }) => {
				const { palettes, set } = new Function(`return ${args.setup}`)()(args.formatId)
				const wait = (ms = 50) => new Promise(resolve => setTimeout(resolve, ms))
				const popover = () => document.querySelector<HTMLElement>('.swatch-popover')
				/** Right-clicks a swatch's popover open, giving Spectrum a moment to set up. */
				const open = async (swatch: HTMLElement) => {
					swatch.dispatchEvent(
						new MouseEvent('contextmenu', { bubbles: true, cancelable: true })
					)
					await wait(300)
				}
				/** Types a hex value into the popover's picker, like a user would. */
				const typeColor = async (color: string) => {
					const input = popover()!.querySelector<HTMLInputElement>('.sp-input')!
					input.value = color
					jQuery(input).trigger('change')
					await wait()
				}
				const action = (label: string) =>
					[...popover()!.querySelectorAll<HTMLElement>('button.action')]
						.find(button => button.textContent?.includes(label))!
						.click()
				const escape = () =>
					window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
				const data = structuredClone(set.palette_set)
				data.permutations[1].strip = { id: 'minecraft:trims/color_palettes/gold' }
				palettes.editPaletteSet(set, data)
				set.select()
				await wait()
				const root = document.querySelector('#animated_java\\:palette_set')!
				const goldSwatch = () => root.querySelectorAll<HTMLElement>('.palette-swatch')[1]
				await open(goldSwatch())
				const opened = !!popover() && Dialog.stack.length === 1
				await typeColor('#123456ff')
				// The set itself only changes on Confirm, so read what the editor shows.
				const typed = goldSwatch().style.background
				// Escape puts back the color the swatch had when the popover opened.
				escape()
				await wait()
				const afterEscape = goldSwatch().style.background

				await open(goldSwatch())
				await typeColor('#123456ff')
				action('Reset to key color')
				await wait()
				const afterReset = goldSwatch().style.background
				await typeColor('#123456ff')
				// Clicking outside keeps the change.
				root.querySelector<HTMLElement>('.previews')!.dispatchEvent(
					new PointerEvent('pointerdown', { bubbles: true })
				)
				await wait()
				const closedByOutsideClick = !popover()

				// Red is a pack palette, so its popover offers to copy it into the set first.
				root.querySelectorAll<HTMLElement>('.permutations .row')[1].click()
				await wait()
				await open(root.querySelectorAll<HTMLElement>('.palette-swatch')[0])
				const pickerBeforeCopy = !!popover()!.querySelector('.sp-container')
				action('Copy palette')
				await wait(300)
				await typeColor('#abcdefff')
				escape()
				await wait()

				const toggle = root.querySelector<HTMLInputElement>('#palette_set_apply_palette')!
				toggle.click()
				await wait()
				const plainCaption = root.querySelector('figcaption')!.textContent!.trim()
				Dialog.open!.confirm()
				const red = set.palette_set.permutations[1].strip
				return {
					opened,
					typed,
					afterEscape,
					afterReset,
					closedByOutsideClick,
					pickerBeforeCopy,
					gold: set.palette_set.permutations[0].strip.colors,
					redId: red.id,
					redColors: red.colors?.length,
					redFirst: red.colors?.[0],
					plainCaption,
				}
			},
			{ setup: SETUP, formatId: BLUEPRINT_FORMAT_ID }
		)
		expect(result.opened).toBe(true)
		expect(result.typed).toBe('rgb(18, 52, 86)')
		expect(result.afterEscape).toBe('rgb(170, 136, 0)')
		expect(result.afterReset).toBe('rgb(128, 128, 128)')
		expect(result.closedByOutsideClick).toBe(true)
		expect(result.gold).toEqual(['#ffff00ff', '#123456ff'])
		// Escape after copying reverts the copy too, back to the pack palette.
		expect(result.pickerBeforeCopy).toBe(false)
		expect(result.redId).toBe('minecraft:trims/color_palettes/gold')
		expect(result.redColors).toBeUndefined()
		expect(result.plainCaption).toBe('armor')
	})

	it('adds key colors, growing the palettes that line up with the key', async () => {
		const result = await blockbench.evaluate(
			async (args: { setup: string; formatId: string }) => {
				const { set } = new Function(`return ${args.setup}`)()(args.formatId)
				const wait = (ms = 50) => new Promise(resolve => setTimeout(resolve, ms))
				const typeColor = async (color: string) => {
					const input = document.querySelector<HTMLInputElement>(
						'.swatch-popover .sp-input'
					)!
					input.value = color
					jQuery(input).trigger('change')
					await wait()
				}
				set.select()
				await wait()
				const root = document.querySelector('#animated_java\\:palette_set')!
				const add = root.querySelector<HTMLElement>('.lineup .swatch.add')!

				add.click()
				await wait(300)
				await typeColor('#ff00ffff')
				const keysWhileAdding = root.querySelectorAll('.lineup .key-swatch').length
				window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
				await wait()
				const keysAfterEscape = root.querySelectorAll('.lineup .key-swatch').length

				add.click()
				await wait(300)
				await typeColor('#00ffffff')
				root.querySelector<HTMLElement>('.previews')!.dispatchEvent(
					new PointerEvent('pointerdown', { bubbles: true })
				)
				await wait()
				Dialog.open!.confirm()
				return {
					keysWhileAdding,
					keysAfterEscape,
					key: set.palette_set.key.colors,
					gold: set.palette_set.permutations[0].strip.colors,
					red: set.palette_set.permutations[1].strip.colors,
				}
			},
			{ setup: SETUP, formatId: BLUEPRINT_FORMAT_ID }
		)
		expect(result.keysWhileAdding).toBe(3)
		expect(result.keysAfterEscape).toBe(2)
		expect(result.key).toEqual(['#e0e0e0ff', '#808080ff', '#00ffffff'])
		expect(result.gold).toEqual(['#ffff00ff', '#aa8800ff', '#00ffffff'])
		expect(result.red).toEqual(['#ff0000ff', '#880000ff', '#00ffffff'])
	})

	it("explains why a reference set's colors and suffixes can't change", async () => {
		const result = await blockbench.evaluate(async (formatId: string) => {
			const g = globalThis as any
			g.newProject(g.Formats[formatId])
			const palettes = (window as any).AnimatedJava.palettes
			const trims = palettes.createPaletteSet(
				'trims',
				palettes.createSetData({
					bases: ['minecraft:trims/items/helmet_trim'],
					key: { id: 'minecraft:trims/color_palettes/trim_palette' },
					permutations: [
						{
							uuid: 'gold',
							suffix: 'gold',
							strip: { id: 'minecraft:trims/color_palettes/gold' },
						},
					],
					reference: { atlas: 'items' },
				})
			)
			const wait = (ms = 50) => new Promise(resolve => setTimeout(resolve, ms))
			trims.select()
			await wait(300)
			const root = document.querySelector('#animated_java\\:palette_set')!
			// The palette loads from the vanilla jar, which can take a moment on a cold start.
			for (let i = 0; i < 200 && !root.querySelector('.palette-swatch'); i++) await wait()
			const messages: string[] = []
			const showQuickMessage = Blockbench.showQuickMessage
			Blockbench.showQuickMessage = (message: string) => void messages.push(message)
			try {
				const button = (title: string) =>
					[...root.querySelectorAll<HTMLElement>('button.tool')].find(
						b => b.title === title
					)!
				button('Add permutation').click()
				button('Add base texture').click()
				root.querySelector<HTMLElement>('.swatch.add')!.click()
				root.querySelector<HTMLInputElement>('input.suffix')!.click()
			} finally {
				Blockbench.showQuickMessage = showQuickMessage
			}
			root.querySelector<HTMLElement>('.palette-swatch')!.dispatchEvent(
				new MouseEvent('contextmenu', { bubbles: true, cancelable: true })
			)
			await wait()
			const popover = document.querySelector('.swatch-popover')
			const note = popover?.querySelector('.note')?.textContent ?? ''
			const picker = !!popover?.querySelector('.sp-container')
			Dialog.open!.cancel()
			return {
				messages: messages.length,
				sameReason: new Set(messages).size === 1,
				explained:
					messages[0]?.includes("can't be changed here") &&
					note.includes("can't be changed here"),
				picker,
				menus: document.querySelectorAll('.contextMenu').length,
			}
		}, BLUEPRINT_FORMAT_ID)
		expect(result).toEqual({
			messages: 4,
			sameReason: true,
			explained: true,
			picker: false,
			menus: 0,
		})
	})

	it("opens a set from the edit button on its group's header", async () => {
		const result = await blockbench.evaluate(
			async (args: { setup: string; formatId: string }) => {
				const { set } = new Function(`return ${args.setup}`)()(args.formatId)
				const frames = () =>
					new Promise(resolve =>
						requestAnimationFrame(() => requestAnimationFrame(resolve))
					)
				await frames()
				const button = document
					.getElementById(set.uuid)!
					.querySelector<HTMLElement>('.aj_palette_set_edit')
				const folded = set.folded
				button?.click()
				await frames()
				const dialog = Dialog.open?.id
				Dialog.open?.cancel()
				return { hasButton: !!button, dialog, foldUnchanged: set.folded === folded }
			},
			{ setup: SETUP, formatId: BLUEPRINT_FORMAT_ID }
		)
		expect(result).toEqual({
			hasButton: true,
			dialog: 'animated_java:palette_set',
			foldUnchanged: true,
		})
	})

	it('undoes and redoes edits made in the dialog, merging quick changes into one step', async () => {
		const result = await blockbench.evaluate(
			async (args: { setup: string; formatId: string }) => {
				const { set } = new Function(`return ${args.setup}`)()(args.formatId)
				const wait = (ms = 50) => new Promise(resolve => setTimeout(resolve, ms))
				// Blockbench's keybinds read the legacy key codes, which synthetic events leave at 0.
				const press = (key: string, shift = false) => {
					const event = new KeyboardEvent('keydown', {
						key,
						ctrlKey: true,
						shiftKey: shift,
					})
					const code = key.toUpperCase().charCodeAt(0)
					Object.defineProperty(event, 'which', { get: () => code })
					Object.defineProperty(event, 'keyCode', { get: () => code })
					window.dispatchEvent(event)
				}
				set.select()
				await wait(300)
				const root = document.querySelector('#animated_java\\:palette_set')!
				const suffixes = () =>
					[...root.querySelectorAll('.permutations .row')].map(row =>
						row.querySelector('.grow')!.textContent!.trim()
					)

				const duplicate = [...root.querySelectorAll<HTMLElement>('button.tool')].find(
					button => button.title === 'Duplicate permutation'
				)!
				duplicate.click()
				await wait(700)
				const input = root.querySelector<HTMLInputElement>('input.suffix')!
				for (const char of 'abc') {
					input.value += char
					input.dispatchEvent(new Event('input', { bubbles: true }))
					await wait()
				}
				await wait(700)
				const edited = suffixes()

				press('z')
				await wait()
				const undoTyping = suffixes()
				press('z')
				await wait()
				const undoDuplicate = suffixes()
				press('z')
				await wait()
				const nothingLeft = suffixes()
				press('z', true)
				await wait()
				const redoDuplicate = suffixes()
				press('y')
				await wait()
				const redoTyping = suffixes()
				Dialog.open!.cancel()
				return { edited, undoTyping, undoDuplicate, nothingLeft, redoDuplicate, redoTyping }
			},
			{ setup: SETUP, formatId: BLUEPRINT_FORMAT_ID }
		)
		expect(result).toEqual({
			edited: ['gold', 'red', 'gold_2abc'],
			undoTyping: ['gold', 'red', 'gold_2'],
			undoDuplicate: ['gold', 'red'],
			nothingLeft: ['gold', 'red'],
			redoDuplicate: ['gold', 'red', 'gold_2'],
			redoTyping: ['gold', 'red', 'gold_2abc'],
		})
	})

	it("shows a recolor's base in the UV editor, and won't paint a reference recolor", async () => {
		const result = await blockbench.evaluate(
			(args: { setup: string; formatId: string }) => {
				const { palettes, cube } = new Function(`return ${args.setup}`)()(args.formatId)
				cube.select()
				UVEditor.vue.updateTexture()
				const uvTexture = (UVEditor.vue as any).texture?.name

				const trims = palettes.createPaletteSet(
					'trims',
					palettes.createSetData({
						bases: ['minecraft:trims/items/helmet_trim'],
						key: { id: 'minecraft:trims/color_palettes/trim_palette' },
						permutations: [
							{
								uuid: 'gold',
								suffix: 'gold',
								strip: { id: 'minecraft:trims/color_palettes/gold' },
							},
						],
						reference: { atlas: 'items' },
					})
				)
				cube.faces.north.texture = palettes.getGeneratedTextures(trims)[0].uuid
				const messages: string[] = []
				const showQuickMessage = Blockbench.showQuickMessage
				Blockbench.showQuickMessage = (message: string) => void messages.push(message)
				let started = false
				const startPaintTool = Painter.startPaintTool
				Painter.startPaintTool = () => void (started = true)
				try {
					Painter.startPaintToolCanvas(
						{ element: cube, face: 'north', intersects: [{ uv: { x: 0, y: 0 } }] },
						new MouseEvent('pointerdown')
					)
				} finally {
					Blockbench.showQuickMessage = showQuickMessage
					Painter.startPaintTool = startPaintTool
				}
				return { uvTexture, started, messages }
			},
			{ setup: SETUP, formatId: BLUEPRINT_FORMAT_ID }
		)
		expect(result.uvTexture).toBe('armor.png')
		expect(result.started).toBe(false)
		expect(result.messages).toEqual([
			"This texture is from a resource pack and can't be painted.",
		])
	})

	it('paints recolors in key colors, picks what faces show and previews colorways', async () => {
		const result = await blockbench.evaluate(
			async (args: { setup: string; formatId: string }) => {
				const { palettes, base, gold, cube } = new Function(`return ${args.setup}`)()(
					args.formatId
				)
				const wait = (ms = 50) => new Promise(resolve => setTimeout(resolve, ms))
				const nextFrame = () =>
					new Promise(resolve =>
						requestAnimationFrame(() => requestAnimationFrame(resolve))
					)
				await palettes.regenerateAllSets()
				const pixel = (texture: Texture) =>
					'#' +
					[...texture.ctx.getImageData(0, 0, 1, 1).data]
						.map(v => v.toString(16).padStart(2, '0'))
						.join('')
				/** A 3D view stroke on the cube's first pixel, the way a click there starts one. */
				const stroke = async (color?: string) => {
					if (color) ColorPanel.set(color)
					Painter.startPaintToolCanvas(
						{
							element: cube,
							face: 'north',
							intersects: [
								{ uv: new THREE.Vector2(0.25, 0.5), point: new THREE.Vector3() },
							],
						},
						new PointerEvent('pointerdown', { button: 0, pointerType: 'mouse' })
					)
					await nextFrame()
					const during = pixel(gold)
					Painter.stopPaintToolCanvas()
					await wait(200)
					return during
				}
				// Textures fill their canvas once their image loads; paint before that is overwritten.
				for (
					let i = 0;
					i < 100 && !(pixel(base).endsWith('ff') && pixel(gold).endsWith('ff'));
					i++
				) {
					await wait()
				}
				cube.faces.north.uv = [0, 0, 2, 1]
				Modes.options.paint.select()
				cube.select()
				UVEditor.vue.updateTexture()
				const messages: string[] = []
				const showQuickMessage = Blockbench.showQuickMessage
				Blockbench.showQuickMessage = (message: string) => void messages.push(message)
				try {
					BarItems.brush_tool.select()
					// Gold's second color is painted as the key's second color.
					const goldDuringStroke = await stroke('#aa8800')
					const mapped = pixel(base)
					await stroke('#3ad0ff')
					const offPalette = pixel(base)
					Undo.undo()
					await wait(200)

					BarItems.color_picker.select()
					await stroke()
					const picked = ColorPanel.get()

					const panel = document.getElementById('panel_animated_java:permutation-panel')!
					/** The form row: the set's name, the select's text and its preview eye. */
					const header = () => {
						const select = panel.querySelector<HTMLElement>('.form .bb-select')!
						return {
							label: panel.querySelector('.form label')!.textContent,
							value: [...select.childNodes]
								.filter(node => node.nodeType === Node.TEXT_NODE)
								.map(node => node.textContent)
								.join(''),
							eye: !!select.querySelector('.icon'),
						}
					}
					const assignedHeader = header()
					panel.querySelector<HTMLElement>('.form .bb-select')!.click()
					await wait()
					;[...document.querySelectorAll<HTMLElement>('.contextMenu li')]
						.find(li => li.textContent!.trim().endsWith('red'))!
						.click()
					await wait()
					const red = palettes
						.getGeneratedTextures(palettes.getPaletteSets()[0])
						.find((t: any) => t.palette_generated.permutation === 'red')!
					const showsRed = gold.getMaterial() === red.getOwnMaterial()
					const previewHeader = header()
					const swatches = [
						...panel.querySelectorAll<HTMLElement>('.palette-swatch'),
					].map(s => s.style.background)
					await stroke()
					const pickedWhilePreviewing = ColorPanel.get()

					Modes.options.edit.select()
					const previewEnded = gold.getMaterial() === gold.getOwnMaterial()
					return {
						goldDuringStroke,
						mapped,
						offPalette,
						messages,
						picked,
						showsRed,
						assignedHeader,
						previewHeader,
						swatches,
						pickedWhilePreviewing,
						previewEnded,
					}
				} finally {
					Blockbench.showQuickMessage = showQuickMessage
				}
			},
			{ setup: SETUP, formatId: BLUEPRINT_FORMAT_ID }
		)
		expect(result).toEqual({
			// The recolor updates while the stroke is still going.
			goldDuringStroke: '#aa8800ff',
			mapped: '#808080ff',
			offPalette: '#3ad0ffff',
			messages: ["#3ad0ff isn't in this palette, so it won't recolor."],
			picked: '#aa8800',
			showsRed: true,
			assignedHeader: { label: 'armor_colors', value: 'As Assigned (gold)', eye: false },
			previewHeader: { label: 'armor_colors', value: 'red', eye: true },
			swatches: ['rgb(255, 0, 0)', 'rgb(136, 0, 0)'],
			pickedWhilePreviewing: '#880000',
			previewEnded: true,
		})
	})

	it("edits the painted set's colors in the Permutation panel, one undo step per edit", async () => {
		const result = await blockbench.evaluate(
			async (args: { setup: string; formatId: string; drag: string }) => {
				const { palettes, set, gold, cube } = new Function(`return ${args.setup}`)()(
					args.formatId
				)
				const { drag } = new Function(`return ${args.drag}`)()()
				const wait = (ms = 50) => new Promise(resolve => setTimeout(resolve, ms))
				await palettes.regenerateAllSets()
				Modes.options.paint.select()
				cube.select()
				UVEditor.vue.updateTexture()
				await wait(300)
				const panel = document.getElementById('panel_animated_java:permutation-panel')!
				const popover = () => document.querySelector<HTMLElement>('.swatch-popover')
				const swatches = (kind: 'key' | 'palette') => [
					...panel.querySelectorAll<HTMLElement>(`.${kind}-swatch`),
				]
				const open = async (swatch: HTMLElement) => {
					swatch.dispatchEvent(
						new MouseEvent('contextmenu', { bubbles: true, cancelable: true })
					)
					await wait(300)
				}
				const typeColor = async (color: string) => {
					const input = popover()!.querySelector<HTMLInputElement>('.sp-input')!
					input.value = color
					jQuery(input).trigger('change')
					await wait(100)
				}
				const action = (label: string) =>
					[...popover()!.querySelectorAll<HTMLElement>('button.action')]
						.find(button => button.textContent?.includes(label))!
						.click()
				const clickOutside = async () => {
					document.body.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))
					await wait(100)
				}
				const goldColors = () => [...set.palette_set.permutations[0].strip.colors]
				/** The second pixel of the gold recolor's canvas, which the model draws from. */
				const shown = () =>
					'#' +
					[...gold.ctx.getImageData(1, 0, 1, 1).data]
						.map((v: number) => v.toString(16).padStart(2, '0'))
						.join('')
				const steps = () => Undo.index

				// Left-click picks the color as the brush color.
				swatches('palette')[1].click()
				const picked = ColorPanel.get()

				// The popover edits live on the model, and closing it is one undo step.
				const before = steps()
				await open(swatches('palette')[1])
				await typeColor('#123456ff')
				await typeColor('#654321ff')
				const live = { shown: shown(), saved: goldColors()[1], steps: steps() - before }
				await clickOutside()
				const committed = { gold: goldColors(), steps: steps() - before }
				Undo.undo()
				await wait(300)
				const undone = {
					gold: goldColors(),
					swatch: swatches('palette')[1].style.background,
				}

				// Escape puts the color and the model back, without an undo step.
				await open(swatches('palette')[1])
				await typeColor('#123456ff')
				window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
				await wait(300)
				const escaped = { gold: goldColors(), shown: shown(), steps: steps() - before }

				// The popover sets the swatch to the brush color, or the brush color to the swatch.
				ColorPanel.set('#00ff00')
				await open(swatches('palette')[0])
				action('Set to brush color')
				await wait()
				await clickOutside()
				const fromBrush = goldColors()[0]
				await open(swatches('key')[0])
				action('Use as brush color')
				await clickOutside()
				const toBrush = ColorPanel.get()

				// Reordering the palette is one undo step too.
				const beforeDrag = steps()
				await drag(swatches('palette')[0], swatches('palette')[1])
				const dragged = { gold: goldColors(), steps: steps() - beforeDrag }
				Modes.options.edit.select()
				return {
					picked,
					live,
					committed,
					undone,
					escaped,
					fromBrush,
					toBrush,
					dragged,
				}
			},
			{ setup: SETUP, formatId: BLUEPRINT_FORMAT_ID, drag: DRAG }
		)
		expect(result).toEqual({
			picked: '#aa8800',
			live: { shown: '#654321ff', saved: '#aa8800ff', steps: 0 },
			committed: { gold: ['#ffff00ff', '#654321ff'], steps: 1 },
			undone: { gold: ['#ffff00ff', '#aa8800ff'], swatch: 'rgb(170, 136, 0)' },
			escaped: { gold: ['#ffff00ff', '#aa8800ff'], shown: '#aa8800ff', steps: 0 },
			fromBrush: '#00ff00ff',
			toBrush: '#e0e0e0',
			dragged: { gold: ['#aa8800ff', '#00ff00ff'], steps: 1 },
		})
	})

	it('only redraws recolors whose inputs changed', async () => {
		const result = await blockbench.evaluate(
			async (args: { setup: string; formatId: string }) => {
				const { palettes, set } = new Function(`return ${args.setup}`)()(args.formatId)
				await palettes.regenerateAllSets()
				const drawn: string[] = []
				const updateSource = Texture.prototype.updateSource
				Texture.prototype.updateSource = function (this: Texture, ...rest: any[]) {
					drawn.push(this.name)
					return updateSource.apply(this, rest as any)
				}
				try {
					await palettes.regenerateAllSets()
					const unchanged = [...drawn]
					const data = structuredClone(set.palette_set)
					data.permutations[1].strip.colors = ['#00ff00ff', '#008800ff']
					palettes.editPaletteSet(set, data)
					drawn.length = 0
					await palettes.regenerateAllSets()
					return { unchanged, changed: [...drawn] }
				} finally {
					Texture.prototype.updateSource = updateSource
				}
			},
			{ setup: SETUP, formatId: BLUEPRINT_FORMAT_ID }
		)
		expect(result.unchanged).toEqual([])
		expect(result.changed).toEqual(['armor_red'])
	})

	it("loads a set's colors into Blockbench's palette and saves the palette back as one undo step", async () => {
		const result = await blockbench.evaluate(
			async (args: { setup: string; readPixels: string; formatId: string }) => {
				const { palettes, set } = new Function(`return ${args.setup}`)()(args.formatId)
				const readPixels = new Function(`return ${args.readPixels}`)()
				const palette = (ColorPanel as any).palette as string[]
				const original = palette.slice()
				const suffixes = () => set.palette_set.permutations.map((p: any) => p.suffix)
				try {
					const toolbar = (Toolbars as any).palette.children.map((item: any) => item.id)

					const loaded = await palettes.loadStripIntoPalette(set, set.palette_set.key)
					const keyColors = palette.slice()
					await palettes.loadStripIntoPalette(set, set.palette_set.permutations[0].strip)
					const goldColors = palette.slice()

					palette.splice(0, Infinity, '#123456', '#654321')
					const added = await palettes.savePaletteToSet(set, undefined, 'Gold Trim')
					const afterAdd = suffixes()
					const addedRecolor = palettes
						.getGeneratedTextures(set)
						.find((t: Texture) => t.name === 'armor_gold_trim')
					const addedPixels = addedRecolor && (await readPixels(addedRecolor))
					const overwritten = await palettes.savePaletteToSet(set, 'red')
					const redColors = set.palette_set.permutations[1].strip.colors
					Undo.undo()
					const redAfterUndo = set.palette_set.permutations[1].strip.colors

					palette.splice(0, Infinity, '#123456')
					const tooShort = await palettes.savePaletteToSet(set, 'red')
					palette.splice(0, Infinity, 'red', '#000000')
					const notHex = await palettes.savePaletteToSet(set, 'red')
					return {
						toolbar,
						loaded,
						keyColors,
						goldColors,
						added,
						afterAdd,
						addedPixels,
						overwritten,
						redColors,
						redAfterUndo,
						tooShort,
						notHex,
						afterErrors: suffixes(),
					}
				} finally {
					palette.splice(0, Infinity, ...original)
				}
			},
			{ setup: SETUP, readPixels: READ_PIXELS, formatId: BLUEPRINT_FORMAT_ID }
		)

		expect(result.toolbar).toEqual(
			expect.arrayContaining([
				'animated_java:action/load-permutation-palette',
				'animated_java:action/save-permutation-palette',
			])
		)
		expect(result.loaded).toBe(true)
		expect(result.keyColors).toEqual(['#e0e0e0', '#808080'])
		expect(result.goldColors).toEqual(['#ffff00', '#aa8800'])
		expect(result.added).toBeUndefined()
		expect(result.afterAdd).toEqual(['gold', 'red', 'gold_trim'])
		expect(result.addedPixels).toEqual(['#123456ff', '#654321ff'])
		expect(result.overwritten).toBeUndefined()
		expect(result.redColors).toEqual(['#123456ff', '#654321ff'])
		expect(result.redAfterUndo).toEqual(['#ff0000ff', '#880000ff'])
		expect(result.tooShort).toContain("has 1 colors, but the set's key has 2")
		expect(result.notHex).toContain("isn't a hex color")
		expect(result.afterErrors).toEqual(['gold', 'red', 'gold_trim'])
	})

	it("previews a picked atlas file's images after its pack moves", async () => {
		const pack = path.join(WORK_DIR, 'moved_pack')
		const write = (rel: string, png: string) => {
			fs.mkdirSync(path.dirname(path.join(pack, rel)), { recursive: true })
			fs.writeFileSync(path.join(pack, rel), Buffer.from(png, 'base64'))
		}
		// 1x1 PNGs: base #808080, key #808080, palette #ff0000.
		const gray =
			'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGNoaGj4DwAFhAKAjM1mJgAAAABJRU5ErkJggg=='
		const red =
			'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGP4z8DwHwAFAAH/iZk9HQAAAABJRU5ErkJggg=='
		write('assets/test/textures/item/base.png', gray)
		write('assets/test/textures/palettes/key.png', gray)
		write('assets/test/textures/palettes/red.png', red)
		const atlasFile = path.join(pack, 'assets/minecraft/atlases/items.json')

		const saved = await blockbench.evaluate(
			async (args: { formatId: string; atlasFile: string }) => {
				const g = globalThis as any
				g.newProject(g.Formats[args.formatId])
				Project!.animated_java.target_minecraft_version = '26.2'
				const palettes = (window as any).AnimatedJava.palettes
				const reference: any = { atlas: 'items', file: args.atlasFile }
				reference.images = await palettes.savePackImages(reference, [
					'assets/test/textures/item/base.png',
					'assets/test/textures/palettes/key.png',
					'assets/test/textures/palettes/red.png',
				])
				palettes.createPaletteSet(
					'moved',
					palettes.createSetData({
						bases: ['test:item/base'],
						key: { id: 'test:palettes/key' },
						permutations: [
							{ uuid: 'red', suffix: 'red', strip: { id: 'test:palettes/red' } },
						],
						reference,
					})
				)
				return Object.keys(reference.images).length
			},
			{ formatId: BLUEPRINT_FORMAT_ID, atlasFile }
		)
		fs.rmSync(pack, { recursive: true, force: true })
		const pixels = await blockbench.evaluate(async (readPixelsSource: string) => {
			const palettes = (window as any).AnimatedJava.palettes
			const readPixels = new Function(`return ${readPixelsSource}`)()
			palettes.clearPalettePreviewCache()
			await palettes.regenerateAllSets()
			const set = palettes.getPaletteSets().find((t: Texture) => t.name === 'moved')
			return readPixels(palettes.getGeneratedTextures(set)[0])
		}, READ_PIXELS)
		const result = { saved, pixels }
		expect(result.saved).toBe(3)
		expect(result.pixels).toEqual(['#ff0000ff'])
	})

	describe('export', () => {
		/** Exports the SETUP project, optionally changed by `tweak`, into `folder`. */
		async function exportSetup(folder: string, version: string, tweak?: string) {
			const dataPackFolder = path.join(folder, 'datapack')
			const resourcePackFolder = path.join(folder, 'resourcepack')
			for (const pack of [dataPackFolder, resourcePackFolder]) {
				fs.mkdirSync(pack, { recursive: true })
				fs.writeFileSync(
					path.join(pack, 'pack.mcmeta'),
					JSON.stringify({ pack: { pack_format: 48, description: 'aj test' } })
				)
			}
			const result = await blockbench.evaluate(
				async (args: {
					setup: string
					tweak?: string
					formatId: string
					version: string
					dataPackFolder: string
					resourcePackFolder: string
				}) => {
					const scene = new Function(`return ${args.setup}`)()(args.formatId)
					if (args.tweak) new Function(`return ${args.tweak}`)()(scene)
					const settings = Project!.animated_java
					settings.enable_plugin_mode = false
					settings.enable_advanced_data_pack_settings = true
					settings.enable_advanced_resource_pack_settings = true
					settings.data_pack_export_mode = 'folder'
					settings.resource_pack_export_mode = 'folder'
					settings.data_pack = args.dataPackFolder
					settings.resource_pack = args.resourcePackFolder
					settings.target_minecraft_version = args.version
					const messages: string[] = []
					const showMessageBox = Blockbench.showMessageBox
					Blockbench.showMessageBox = (options: MessageBoxOptions) => {
						messages.push(String(options.message ?? ''))
						return undefined as any
					}
					const errors: string[] = []
					const consoleError = console.error
					console.error = (...a: any[]) => {
						errors.push(a.map(x => String(x?.stack ?? x)).join(' '))
						consoleError(...a)
					}
					try {
						const ok = await (window as any).AnimatedJava.exportProject()
						if (!ok && !messages.length)
							messages.push('UNEXPECTED: ' + errors.join('\n'))
						return {
							ok: ok as boolean,
							message: messages.join('\n'),
							blueprintId: settings.blueprint_id as string,
						}
					} finally {
						Blockbench.showMessageBox = showMessageBox
						console.error = consoleError
					}
				},
				{
					setup: SETUP,
					tweak,
					formatId: BLUEPRINT_FORMAT_ID,
					version,
					dataPackFolder,
					resourcePackFolder,
				}
			)
			const readJson = (rel: string) =>
				JSON.parse(fs.readFileSync(path.join(resourcePackFolder, rel), 'utf-8'))
			return { ...result, resourcePackFolder, readJson }
		}

		const paletteSources = (atlas: any) =>
			atlas.sources.filter((s: any) => s.type === 'paletted_permutations')

		it('writes palettes, one atlas source, and models using the recolor', async () => {
			const run = await exportSetup(path.join(WORK_DIR, 'export_1_21_4'), '1.21.4')
			expect(run.message).toBe('')
			expect(run.ok).toBe(true)

			const [namespace, rigPath] = run.blueprintId.split(':')
			const sources = paletteSources(run.readJson('assets/minecraft/atlases/blocks.json'))
			expect(sources).toEqual([
				{
					type: 'paletted_permutations',
					textures: [`${namespace}:blueprint/${rigPath}/armor`],
					palette_key: `${namespace}:palettes/blueprint/${rigPath}/armor_colors/key`,
					permutations: {
						gold: `${namespace}:palettes/blueprint/${rigPath}/armor_colors/palettes/gold`,
						red: `${namespace}:palettes/blueprint/${rigPath}/armor_colors/palettes/red`,
					},
				},
			])

			const paletteFolder = path.join(
				run.resourcePackFolder,
				'assets',
				namespace,
				'textures/palettes/blueprint',
				rigPath,
				'armor_colors'
			)
			expect(fs.existsSync(path.join(paletteFolder, 'key.png'))).toBe(true)
			expect(fs.existsSync(path.join(paletteFolder, 'palettes/gold.png'))).toBe(true)
			expect(
				fs.existsSync(
					path.join(
						run.resourcePackFolder,
						'assets',
						namespace,
						'textures/blueprint',
						rigPath,
						'armor.png'
					)
				)
			).toBe(true)
			expect(
				fs.existsSync(
					path.join(
						run.resourcePackFolder,
						'assets',
						namespace,
						'textures/blueprint',
						rigPath,
						'armor_gold.png'
					)
				)
			).toBe(false)

			const model = run.readJson(`assets/${namespace}/models/blueprint/${rigPath}/bone.json`)
			expect(Object.values(model.textures)).toContain(
				`${namespace}:blueprint/${rigPath}/armor_gold`
			)
		}, 180_000)

		it('replaces its own atlas source when re-exporting', async () => {
			const folder = path.join(WORK_DIR, 'export_twice')
			await exportSetup(folder, '1.21.4')
			const run = await exportSetup(
				folder,
				'1.21.4',
				`(scene) => {
					const data = structuredClone(scene.set.palette_set)
					data.permutations[1].suffix = 'crimson'
					window.AnimatedJava.palettes.editPaletteSet(scene.set, data)
				}`
			)
			expect(run.ok).toBe(true)
			const sources = paletteSources(run.readJson('assets/minecraft/atlases/blocks.json'))
			expect(sources).toHaveLength(1)
			expect(Object.keys(sources[0].permutations)).toEqual(['gold', 'crimson'])
		}, 180_000)

		it('ids palettes under textures/palettes/ from 26.3', async () => {
			const run = await exportSetup(path.join(WORK_DIR, 'export_26_3'), '26.3')
			expect(run.message).toBe('')
			expect(run.ok).toBe(true)
			const [namespace, rigPath] = run.blueprintId.split(':')
			const [source] = paletteSources(run.readJson('assets/minecraft/atlases/blocks.json'))
			expect(source.palette_key).toBe(`${namespace}:blueprint/${rigPath}/armor_colors/key`)
		}, 180_000)

		it('fails on a palette that does not match its key', async () => {
			const run = await exportSetup(
				path.join(WORK_DIR, 'export_bad'),
				'1.21.4',
				`(scene) => {
					const data = structuredClone(scene.set.palette_set)
					data.permutations[0].strip.colors.pop()
					window.AnimatedJava.palettes.editPaletteSet(scene.set, data)
				}`
			)
			expect(run.ok).toBe(false)
			expect(run.message).toContain('Permutation Set "armor_colors"')
			expect(run.message).toContain('"gold" has 1 colors, but the key has 2')
		}, 180_000)

		it('references vanilla trims without writing a source, and checks their atlas', async () => {
			const referenceTweak = `(scene) => {
				const palettes = window.AnimatedJava.palettes
				const trims = palettes.createPaletteSet('trims', palettes.createSetData({
					bases: ['minecraft:trims/items/helmet_trim'],
					key: { id: 'minecraft:trims/color_palettes/trim_palette' },
					permutations: [{ uuid: 'gold', suffix: 'gold', strip: { id: 'minecraft:trims/color_palettes/gold' } }],
					reference: { atlas: 'items' },
				}))
				const trim = palettes.getGeneratedTextures(trims)[0]
				for (const face of Object.values(scene.cube.faces)) face.texture = trim.uuid
			}`
			const run = await exportSetup(path.join(WORK_DIR, 'export_ref'), '26.2', referenceTweak)
			expect(run.message).toBe('')
			expect(run.ok).toBe(true)
			const [namespace, rigPath] = run.blueprintId.split(':')
			const model = run.readJson(`assets/${namespace}/models/blueprint/${rigPath}/bone.json`)
			expect(Object.values(model.textures)).toContain(
				'minecraft:trims/items/helmet_trim_gold'
			)
			expect(paletteSources(run.readJson('assets/minecraft/atlases/blocks.json'))).toEqual([])

			const mixed = await exportSetup(
				path.join(WORK_DIR, 'export_ref_mixed'),
				'26.2',
				`(scene) => {
					(${referenceTweak})(scene)
					scene.cube.faces.south.texture = scene.base.uuid
				}`
			)
			expect(mixed.ok).toBe(false)
			expect(mixed.message).toContain('mixes textures from more than one atlas')
		}, 180_000)
	})
})
