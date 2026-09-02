import { describe, expect, it } from '@jest/globals'
import { blockbench } from '@snavesutit/jestbench'

const BLUEPRINT_FORMAT_ID = 'animated-java:format/blueprint'

const TYPE = {
	textDisplay: 'animated_java:text_display',
	itemDisplay: 'animated_java:vanilla_item_display',
	blockDisplay: 'animated_java:vanilla_block_display',
	interaction: 'animated_java:interaction',
} as const

// `renderRig` builds `<modelExportFolder>/<node>.json` and validates it as a
// resource-pack path, so the folders must look real.
const MODEL_FOLDER = 'assets/aj/models/blueprint/test'
const TEXTURE_FOLDER = 'assets/aj/textures/blueprint/test'

/**
 * The four outliner element types Animated Java registers on top of Blockbench's
 * own (`src/outliner/`): text / item / block displays and interactions. Covers
 * type registration, constructor defaults, the observable-backed property
 * accessors, `renderRig` node mapping, and a codec round-trip.
 */
describe('AJ outliner elements', () => {
	it('register their types and construct with documented defaults', async () => {
		const result = await blockbench.evaluate((formatId: string) => {
			const aj = (window as any).AnimatedJava
			const g = globalThis as any
			g.newProject(g.Formats[formatId])

			const td = new aj.TextDisplay({}).init()
			const id = new aj.VanillaItemDisplay({}).init()
			const bd = new aj.VanillaBlockDisplay({}).init()
			const ix = new aj.Interaction({}).init()

			const registered = (type: string) => (OutlinerElement.types as any)[type]?.name

			return {
				types: {
					td: td.type,
					id: id.type,
					bd: bd.type,
					ix: ix.type,
				},
				registered: {
					td: registered('animated_java:text_display'),
					id: registered('animated_java:vanilla_item_display'),
					bd: registered('animated_java:vanilla_block_display'),
					ix: registered('animated_java:interaction'),
				},
				inAllArrays: [
					aj.TextDisplay.all.includes(td),
					aj.VanillaItemDisplay.all.includes(id),
					aj.VanillaBlockDisplay.all.includes(bd),
					aj.Interaction.all.includes(ix),
				],
				textDisplayDefaults: {
					text: td.text,
					lineWidth: td.lineWidth,
					backgroundColor: td.backgroundColor,
					align: td.align,
					shadow: td.shadow,
					seeThrough: td.seeThrough,
				},
				itemDisplayDefaults: { item: id.item, itemDisplay: id.itemDisplay },
				blockDisplayDefaults: { block: bd.block },
				sharedDefaults: {
					visibility: [td.visibility, id.visibility, bd.visibility, ix.visibility],
					scale: ix.scale,
					onSummon: [td.onSummonFunction, id.onSummonFunction, ix.onSummonFunction],
				},
			}
		}, BLUEPRINT_FORMAT_ID)

		expect(result.types).toEqual({
			td: TYPE.textDisplay,
			id: TYPE.itemDisplay,
			bd: TYPE.blockDisplay,
			ix: TYPE.interaction,
		})
		expect(result.registered.td).toBe('TextDisplay')
		expect(result.registered.id).toBe('VanillaItemDisplay')
		expect(result.registered.bd).toBe('VanillaBlockDisplay')
		expect(result.registered.ix).toBe('Interaction')
		expect(result.inAllArrays).toEqual([true, true, true, true])

		expect(result.textDisplayDefaults).toEqual({
			text: '"Hello World!"',
			lineWidth: 200,
			backgroundColor: '#00000040',
			align: 'center',
			shadow: false,
			seeThrough: false,
		})
		expect(result.itemDisplayDefaults).toEqual({
			item: 'minecraft:diamond',
			itemDisplay: 'none',
		})
		expect(result.blockDisplayDefaults).toEqual({ block: 'minecraft:stone' })
		expect(result.sharedDefaults.visibility).toEqual([true, true, true, true])
		expect(result.sharedDefaults.scale).toEqual([1, 1, 1])
		expect(result.sharedDefaults.onSummon).toEqual(['', '', ''])
	})

	it('property accessors update the value and flag a text-mesh rebuild', async () => {
		const result = await blockbench.evaluate((formatId: string) => {
			const aj = (window as any).AnimatedJava
			const g = globalThis as any
			g.newProject(g.Formats[formatId])

			const td = new aj.TextDisplay({}).init()
			td.needsMeshUpdate = false
			td.text = '"changed"'
			const afterText = td.needsMeshUpdate
			td.needsMeshUpdate = false
			td.align = 'left'
			td.lineWidth = 42
			td.shadow = true
			const afterOptions = td.needsMeshUpdate

			const id = new aj.VanillaItemDisplay({}).init()
			id.item = 'minecraft:stick'
			id.itemDisplay = 'head'

			const bd = new aj.VanillaBlockDisplay({}).init()
			bd.block = 'minecraft:oak_stairs[facing=east]'

			return {
				afterText,
				afterOptions,
				text: td.text,
				align: td.align,
				lineWidth: td.lineWidth,
				shadow: td.shadow,
				item: id.item,
				itemDisplay: id.itemDisplay,
				block: bd.block,
			}
		}, BLUEPRINT_FORMAT_ID)

		expect(result.afterText).toBe(true)
		expect(result.afterOptions).toBe(true)
		expect(result.text).toBe('"changed"')
		expect(result.align).toBe('left')
		expect(result.lineWidth).toBe(42)
		expect(result.shadow).toBe(true)
		expect(result.item).toBe('minecraft:stick')
		expect(result.itemDisplay).toBe('head')
		expect(result.block).toBe('minecraft:oak_stairs[facing=east]')
	})

	it('renderRig maps each element to its node type with element-specific fields', async () => {
		const result = await blockbench.evaluate(
			(args: { formatId: string; modelFolder: string; textureFolder: string }) => {
				const aj = (window as any).AnimatedJava
				const g = globalThis as any
				g.newProject(g.Formats[args.formatId])

				const td = new aj.TextDisplay({}).init()
				td.text = '"node"'
				td.align = 'right'
				td.lineWidth = 123
				td.shadow = true
				td.seeThrough = true

				const id = new aj.VanillaItemDisplay({}).init()
				id.item = 'minecraft:blaze_rod'
				id.itemDisplay = 'firstperson_righthand'

				const bd = new aj.VanillaBlockDisplay({}).init()
				bd.block = 'minecraft:campfire'

				const ix = new aj.Interaction({}).init()
				ix.scale = [2, 3, 2]

				const rig = aj.renderRig(args.modelFolder, args.textureFolder)
				const nodes = Object.values(rig.nodes) as any[]
				const node = (type: string) => nodes.find(n => n.type === type)

				return {
					types: nodes.map(n => n.type).sort(),
					textDisplay: node('text_display'),
					itemDisplay: node('item_display'),
					blockDisplay: node('block_display'),
					interaction: node('interaction'),
				}
			},
			{
				formatId: BLUEPRINT_FORMAT_ID,
				modelFolder: MODEL_FOLDER,
				textureFolder: TEXTURE_FOLDER,
			}
		)

		expect(result.types).toEqual([
			'block_display',
			'interaction',
			'item_display',
			'text_display',
		])

		expect(result.textDisplay).toMatchObject({
			type: 'text_display',
			text: '"node"',
			line_width: 123,
			align: 'right',
			shadow: true,
			see_through: true,
		})
		expect(result.itemDisplay).toMatchObject({
			type: 'item_display',
			item: 'minecraft:blaze_rod',
			item_display: 'firstperson_righthand',
		})
		expect(result.blockDisplay).toMatchObject({
			type: 'block_display',
			block: 'minecraft:campfire',
		})
		// Interaction width/height are `scale / 16`.
		expect(result.interaction).toMatchObject({ type: 'interaction' })
		expect(result.interaction.width).toBeCloseTo(2 / 16)
		expect(result.interaction.height).toBeCloseTo(3 / 16)
	})

	it('survive a codec compile → parse round-trip', async () => {
		const result = await blockbench.evaluate((formatId: string) => {
			const aj = (window as any).AnimatedJava
			const codec = aj.BLUEPRINT_CODEC.get()
			const g = globalThis as any
			g.newProject(g.Formats[formatId])

			const td = new aj.TextDisplay({}).init()
			td.text = '"round trip"'
			td.align = 'left'
			td.lineWidth = 77
			td.shadow = true
			td.backgroundColor = '#12345678'
			td.onSummonFunction = 'test:td'

			const id = new aj.VanillaItemDisplay({}).init()
			id.item = 'minecraft:golden_apple'
			id.itemDisplay = 'ground'
			id.onSummonFunction = 'test:id'

			const bd = new aj.VanillaBlockDisplay({}).init()
			bd.block = 'minecraft:note_block[note=5]'

			const ix = new aj.Interaction({}).init()
			ix.scale = [4, 5, 4]
			ix.onSummonFunction = 'test:ix'

			const compiled = codec.compile({ raw: true, bitmaps: false })
			g.newProject(g.Formats[formatId])
			codec.parse(compiled, 'elements.ajblueprint')

			const rtTd = aj.TextDisplay.all[0]
			const rtId = aj.VanillaItemDisplay.all[0]
			const rtBd = aj.VanillaBlockDisplay.all[0]
			const rtIx = aj.Interaction.all[0]

			return {
				counts: [
					aj.TextDisplay.all.length,
					aj.VanillaItemDisplay.all.length,
					aj.VanillaBlockDisplay.all.length,
					aj.Interaction.all.length,
				],
				td: {
					text: rtTd?.text,
					align: rtTd?.align,
					lineWidth: rtTd?.lineWidth,
					shadow: rtTd?.shadow,
					backgroundColor: rtTd?.backgroundColor,
					onSummonFunction: rtTd?.onSummonFunction,
				},
				id: {
					item: rtId?.item,
					itemDisplay: rtId?.itemDisplay,
					onSummonFunction: rtId?.onSummonFunction,
				},
				bd: { block: rtBd?.block },
				ix: { scale: rtIx?.scale, onSummonFunction: rtIx?.onSummonFunction },
			}
		}, BLUEPRINT_FORMAT_ID)

		expect(result.counts).toEqual([1, 1, 1, 1])
		expect(result.td).toEqual({
			text: '"round trip"',
			align: 'left',
			lineWidth: 77,
			shadow: true,
			backgroundColor: '#12345678',
			onSummonFunction: 'test:td',
		})
		expect(result.id).toEqual({
			item: 'minecraft:golden_apple',
			itemDisplay: 'ground',
			onSummonFunction: 'test:id',
		})
		expect(result.bd).toEqual({ block: 'minecraft:note_block[note=5]' })
		expect(result.ix).toEqual({ scale: [4, 5, 4], onSummonFunction: 'test:ix' })
	})
})
