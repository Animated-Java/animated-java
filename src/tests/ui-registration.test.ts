import { describe, expect, it } from '@jest/globals'
import { blockbench } from '@snavesutit/jestbench'

const BLUEPRINT_FORMAT_ID = 'animated-java:format/blueprint'

/**
 * Smoke coverage for the UI layer (`src/interface/`, `src/dialogs/`,
 * `src/panels/`) and the `src/mods/` monkeypatches: the format, actions, panels
 * and menu Animated Java registers all load, and the class-property patches
 * apply on a Blueprint project.
 */
describe('Animated Java registration', () => {
	it('registers the Blueprint format', async () => {
		const format = await blockbench.evaluate((formatId: string) => {
			const f = (globalThis as any).Formats[formatId]
			return { exists: !!f, id: f?.id, animated: f?.animated_java_format }
		}, BLUEPRINT_FORMAT_ID)
		expect(format.exists).toBe(true)
		expect(format.id).toBe(BLUEPRINT_FORMAT_ID)
	})

	it('registers its bar actions', async () => {
		const missing = await blockbench.evaluate(() => {
			const ids = [
				'animated_java:action/export',
				'animated_java:action/export-all',
				'animated_java:action/blueprint-settings',
				'animated_java:action/create-text-display',
				'animated_java:action/create-item-display',
				'animated_java:action/create-block-display',
				'animated_java:action/create-interaction',
				'animated_java:action/create-variant',
				'animated_java:action/open-variant-config',
				'animated_java:action/about',
			]
			return ids.filter(id => !(globalThis as any).BarItems[id])
		})
		expect(missing).toEqual([])
	})

	it('registers its panels and menu bar entry', async () => {
		const result = await blockbench.evaluate(() => {
			const g = globalThis as any
			return {
				panels: ['animated_java:variants-panel', 'animated_java:panel/easings'].filter(
					id => !g.Panels[id]
				),
				menu: !!g.MenuBar?.menus?.['animated_java:menubar/main'],
			}
		})
		expect(result.panels).toEqual([])
		expect(result.menu).toBe(true)
	})

	it('applies the class-property mods on a Blueprint project', async () => {
		const props = await blockbench.evaluate((formatId: string) => {
			const g = globalThis as any
			g.newProject(g.Formats[formatId])
			return {
				// groupMod
				groupOnSummon: !!(Group as any).properties?.onSummonFunction,
				groupConfigs: !!(Group as any).properties?.configs,
				// keyframeEasing
				keyframeEasing: !!(Blockbench.Keyframe as any).properties?.easing,
				keyframeEasingArgs: !!(Blockbench.Keyframe as any).properties?.easingArgs,
				// locatorPropertiesMod
				locatorConfig: !!(Locator as any).properties?.config,
			}
		}, BLUEPRINT_FORMAT_ID)

		expect(props).toEqual({
			groupOnSummon: true,
			groupConfigs: true,
			keyframeEasing: true,
			keyframeEasingArgs: true,
			locatorConfig: true,
		})
	})

	it('exposes the documented public API surface', async () => {
		const shape = await blockbench.evaluate(() => {
			const api = (window as any).AnimatedJava
			const expected = [
				'BLUEPRINT_FORMAT',
				'BLUEPRINT_CODEC',
				'exportProject',
				'renderRig',
				'renderProjectAnimations',
				'Variant',
				'TextDisplay',
				'VanillaItemDisplay',
				'VanillaBlockDisplay',
				'Interaction',
				'assetManager',
				'blockModelManager',
				'itemModelManager',
			]
			return {
				missing: expected.filter(k => !(k in api)),
			}
		})
		expect(shape.missing).toEqual([])
	})
})
