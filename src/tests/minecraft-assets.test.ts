import { describe, expect, it } from '@jest/globals'
import { blockbench } from '@snavesutit/jestbench'

const BLUEPRINT_FORMAT_ID = 'animated-java:format/blueprint'

/**
 * The `src/systems/minecraft/` asset layer: `assetManager` loads/caches vanilla
 * JSON + PNG assets for a Minecraft version, and `blockModelManager` /
 * `itemModelManager` resolve vanilla block/item models on top of it (via the
 * external block-model-renderer). Assets for the default target version are
 * downloaded + cached under `~/.envbench` on first run.
 *
 * Each model build runs in its own `blockbench.evaluate` - the first-run asset
 * work for a fresh version is slow enough that one combined call can blow the
 * CDP protocol timeout.
 */
describe('minecraft asset systems', () => {
	// 26.3's en_us.json is the first jar entry big enough for fflate's async unzip to hand to a
	// worker, which the production build's `keepNames` breaks.
	it('loads a client jar with entries over 512KB', async () => {
		const result = await blockbench.evaluate(async () => {
			const aj = (window as any).AnimatedJava
			const lang = await aj.assetManager.getJSONAsset(
				'26.3',
				'assets/minecraft/lang/en_us.json'
			)
			return Object.keys(lang).length
		})
		expect(result).toBeGreaterThan(1000)
	}, 180_000)

	it('assetManager resolves and rejects vanilla asset paths', async () => {
		const result = await blockbench.evaluate(async (formatId: string) => {
			const aj = (window as any).AnimatedJava
			const g = globalThis as any
			g.newProject(g.Formats[formatId])
			const version = Project.animated_java.target_minecraft_version

			const font = await aj.assetManager.getJSONAsset(
				version,
				'assets/minecraft/font/include/default.json'
			)
			const stoneModel = await aj.assetManager.getJSONAsset(
				version,
				'assets/minecraft/models/block/stone.json'
			)
			return {
				version,
				hasStone: await aj.assetManager.hasAsset(
					version,
					'assets/minecraft/models/block/stone.json'
				),
				hasNonsense: await aj.assetManager.hasAsset(
					version,
					'assets/minecraft/models/block/__does_not_exist__.json'
				),
				fontHasProviders: Array.isArray(font?.providers),
				stoneModelResolved: !!(stoneModel?.parent ?? stoneModel?.textures),
			}
		}, BLUEPRINT_FORMAT_ID)

		expect(typeof result.version).toBe('string')
		expect(result.hasStone).toBe(true)
		expect(result.hasNonsense).toBe(false)
		expect(result.fontHasProviders).toBe(true)
		expect(result.stoneModelResolved).toBe(true)
	})

	it('getBlockState resolves a vanilla blockstate', async () => {
		const ok = await blockbench.evaluate(async (formatId: string) => {
			const aj = (window as any).AnimatedJava
			const g = globalThis as any
			g.newProject(g.Formats[formatId])
			const state = await aj.getBlockState('oak_stairs')
			return !!state && typeof state === 'object'
		}, BLUEPRINT_FORMAT_ID)
		expect(ok).toBe(true)
	})

	it('itemModelManager builds a vanilla item mesh', async () => {
		const built = await blockbench.evaluate(async (formatId: string) => {
			const aj = (window as any).AnimatedJava
			const g = globalThis as any
			g.newProject(g.Formats[formatId])
			const item = await aj.itemModelManager.getItemModel('minecraft:stick', 'gui')
			return !!item?.mesh
		}, BLUEPRINT_FORMAT_ID)
		expect(built).toBe(true)
	}, 120_000)

	it('blockModelManager builds a vanilla block mesh', async () => {
		const result = await blockbench.evaluate(async (formatId: string) => {
			const aj = (window as any).AnimatedJava
			const g = globalThis as any
			g.newProject(g.Formats[formatId])
			const block = await aj.blockModelManager.getBlockModel('stone')
			return {
				isBlock: block?.isBlock === true,
				hasChildren: (block?.mesh?.children?.length ?? 0) > 0,
			}
		}, BLUEPRINT_FORMAT_ID)
		expect(result.isBlock).toBe(true)
		expect(result.hasChildren).toBe(true)
	}, 120_000)
})
