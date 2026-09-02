import { describe, expect, it } from '@jest/globals'
import { blockbench } from '@snavesutit/jestbench'

const BLUEPRINT_FORMAT_ID = 'animated-java:format/blueprint'

/**
 * `blockModelManager` / `itemModelManager` resolve vanilla block & item models
 * (via the external `block-model-renderer`) for in-editor previews of
 * block/item display nodes - including blockstate variant selection and item
 * model predicates. Meshes can't cross `blockbench.evaluate`, so each test
 * reduces a mesh to a structural signature (child transforms) in the renderer.
 */
describe('vanilla block/item display rendering', () => {
	it('selects a different blockstate variant for stairs facing east', async () => {
		const result = await blockbench.evaluate((formatId: string) => {
			const aj = (window as any).AnimatedJava
			const g = globalThis as any
			g.newProject(g.Formats[formatId])

			const signature = (mesh: any) => {
				const parts: string[] = []
				mesh.updateMatrixWorld(true)
				mesh.traverse((o: any) => {
					const round = (n: number) => Math.round(n * 1000) / 1000
					parts.push(
						o.type +
							':' +
							o.position.toArray().map(round).join(',') +
							'|' +
							o.quaternion.toArray().map(round).join(',')
					)
				})
				return parts.sort().join(';')
			}

			return Promise.all([
				aj.blockModelManager.getBlockModel('minecraft:oak_stairs'),
				aj.blockModelManager.getBlockModel('minecraft:oak_stairs[facing=east]'),
				aj.blockModelManager.getBlockModel('minecraft:oak_stairs'),
			]).then(([base, east, baseAgain]) => ({
				base: signature(base.mesh),
				east: signature(east.mesh),
				baseAgain: signature(baseAgain.mesh),
			}))
		}, BLUEPRINT_FORMAT_ID)

		expect(result.base).toBe(result.baseAgain)
		expect(result.east).not.toBe(result.base)
	}, 120_000)

	it('resolves a multi-property blockstate (slab type)', async () => {
		const result = await blockbench.evaluate((formatId: string) => {
			const aj = (window as any).AnimatedJava
			const g = globalThis as any
			g.newProject(g.Formats[formatId])

			const signature = (mesh: any) => {
				const parts: string[] = []
				mesh.updateMatrixWorld(true)
				mesh.traverse((o: any) => {
					const round = (n: number) => Math.round(n * 1000) / 1000
					parts.push(o.type + ':' + o.position.toArray().map(round).join(','))
				})
				return parts.sort().join(';')
			}

			return Promise.all([
				aj.blockModelManager.getBlockModel('minecraft:oak_slab[type=top]'),
				aj.blockModelManager.getBlockModel('minecraft:oak_slab[type=bottom]'),
			]).then(([top, bottom]) => ({
				top: signature(top.mesh),
				bottom: signature(bottom.mesh),
				bothBlocks: top.isBlock === true && bottom.isBlock === true,
			}))
		}, BLUEPRINT_FORMAT_ID)

		expect(result.bothBlocks).toBe(true)
		expect(result.top).not.toBe(result.bottom)
	}, 120_000)

	it('resolves an item model with predicates (bow) and honours the display mode', async () => {
		const result = await blockbench.evaluate((formatId: string) => {
			const aj = (window as any).AnimatedJava
			const g = globalThis as any
			g.newProject(g.Formats[formatId])

			const signature = (mesh: any) => {
				const parts: string[] = []
				mesh.updateMatrixWorld(true)
				mesh.traverse((o: any) => {
					const round = (n: number) => Math.round(n * 1000) / 1000
					parts.push(
						o.type +
							':' +
							o.position.toArray().map(round).join(',') +
							'|' +
							o.scale.toArray().map(round).join(',')
					)
				})
				return parts.sort().join(';')
			}

			return Promise.all([
				aj.itemModelManager.getItemModel('minecraft:bow', 'gui'),
				aj.itemModelManager.getItemModel('minecraft:diamond_sword', 'gui'),
				aj.itemModelManager.getItemModel(
					'minecraft:diamond_sword',
					'thirdperson_righthand'
				),
			]).then(([bow, swordGui, swordThird]) => ({
				bowBuilt: !!bow?.mesh,
				swordGui: signature(swordGui.mesh),
				swordThird: signature(swordThird.mesh),
			}))
		}, BLUEPRINT_FORMAT_ID)

		expect(result.bowBuilt).toBe(true)
		expect(result.swordGui).not.toBe(result.swordThird)
	}, 120_000)
})
