import { beforeEach, describe, expect, it } from '@jest/globals'
import { blockbench } from '@snavesutit/jestbench'

const BLUEPRINT_FORMAT_ID = 'animated-java:format/blueprint'

/**
 * Behavioural coverage for the UI layer: firing an action does what clicking its
 * button would (creates elements / variants, opens dialogs), and condition-gated
 * actions stay disabled outside a Blueprint project.
 *
 * `ui-registration.test.ts` covers that these actions *exist*; this covers what
 * they *do*.
 */
describe('UI behaviour', () => {
	beforeEach(async () => {
		// Make sure no dialog is left open between tests.
		await blockbench.evaluate(() => (globalThis as any).Dialog?.open?.cancel?.())
	})

	describe('create-element actions', () => {
		const cases = [
			{ action: 'animated_java:action/create-text-display', all: 'TextDisplay' },
			{ action: 'animated_java:action/create-item-display', all: 'VanillaItemDisplay' },
			{ action: 'animated_java:action/create-block-display', all: 'VanillaBlockDisplay' },
			{ action: 'animated_java:action/create-interaction', all: 'Interaction' },
		] as const

		it.each(cases)('$action adds and selects a $all', async ({ action, all }) => {
			await blockbench.newProject(BLUEPRINT_FORMAT_ID)

			const before = await blockbench.evaluate(
				key => (window as any).AnimatedJava[key].all.length,
				all
			)
			await blockbench.action(action).trigger()
			const after = await blockbench.evaluate(key => {
				const cls = (window as any).AnimatedJava[key]
				const el = cls.all.at(-1)
				return { count: cls.all.length, selected: !!el?.selected }
			}, all)

			expect(after.count).toBe(before + 1)
			expect(after.selected).toBe(true)
		})

		it('stays disabled on a non-Blueprint project', async () => {
			await blockbench.newProject('free')
			expect(
				await blockbench.action('animated_java:action/create-text-display').isEnabled()
			).toBe(false)

			await blockbench.newProject(BLUEPRINT_FORMAT_ID)
			expect(
				await blockbench.action('animated_java:action/create-text-display').isEnabled()
			).toBe(true)
		})
	})

	describe('variant panel actions', () => {
		it('create / duplicate / delete variants, but never the default', async () => {
			await blockbench.newProject(BLUEPRINT_FORMAT_ID)
			const count = () =>
				blockbench.evaluate(() => (window as any).AnimatedJava.Variant.all.length)
			const selectLast = () =>
				blockbench.evaluate(() => {
					const all = (window as any).AnimatedJava.Variant.all
					all.at(-1).select()
				})
			const selectDefault = () =>
				blockbench.evaluate(() => (window as any).AnimatedJava.Variant.selectDefault())

			expect(await count()).toBe(1)

			await blockbench.action('animated_java:action/create-variant').trigger()
			expect(await count()).toBe(2)

			await selectLast()
			await blockbench.action('animated_java:action/duplicate-variant').trigger()
			expect(await count()).toBe(3)

			await selectLast()
			await blockbench.action('animated_java:action/delete-variant').trigger()
			expect(await count()).toBe(2)

			// The default variant cannot be deleted.
			await selectDefault()
			expect(await blockbench.action('animated_java:action/delete-variant').isEnabled()).toBe(
				false
			)
			await blockbench.action('animated_java:action/delete-variant').trigger()
			expect(await count()).toBe(2)
		})
	})

	describe('dialogs', () => {
		it('the About action opens and closes its dialog', async () => {
			await blockbench.newProject(BLUEPRINT_FORMAT_ID)
			await blockbench.action('animated_java:action/about').trigger()

			expect(await blockbench.dialog().isOpen()).toBe(true)
			expect(await blockbench.dialog().id()).toBe('animated_java:aboutDialog')

			await blockbench.dialog().cancel()
			expect(await blockbench.dialog().isOpen()).toBe(false)
		})

		it('the Blueprint Settings action opens its sidebar dialog', async () => {
			await blockbench.newProject(BLUEPRINT_FORMAT_ID)
			await blockbench.action('animated_java:action/blueprint-settings').trigger()

			expect(await blockbench.dialog().isOpen()).toBe(true)
			expect(await blockbench.dialog().id()).toBe('animated_java_blueprint_settings')

			await blockbench.dialog().cancel()
			expect(await blockbench.dialog().isOpen()).toBe(false)
		})

		it('the variant config action opens for a non-default variant only', async () => {
			await blockbench.newProject(BLUEPRINT_FORMAT_ID)
			const openConfig = blockbench.action('animated_java:action/open-variant-config')

			// Default selected -> disabled.
			expect(await openConfig.isEnabled()).toBe(false)

			await blockbench.evaluate(() =>
				new (window as any).AnimatedJava.Variant('Cfg').select()
			)
			expect(await openConfig.isEnabled()).toBe(true)

			await openConfig.trigger()
			expect(await blockbench.dialog().id()).toBe('animated_java:variantConfig')
			await blockbench.dialog().cancel()
		})

		it('the export progress dialog can be opened for debugging', async () => {
			await blockbench.newProject(BLUEPRINT_FORMAT_ID)
			await blockbench.evaluate(() =>
				(window as any).AnimatedJava.debugExportProgressDialog()
			)

			expect(await blockbench.dialog().id()).toBe('animated_java:exportProgressDialog')
			await blockbench.dialog().cancel()
			expect(await blockbench.dialog().isOpen()).toBe(false)
		})
	})
})
