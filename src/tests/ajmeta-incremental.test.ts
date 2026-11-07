import { describe, expect, it } from '@jest/globals'
import { blockbench } from '@snavesutit/jestbench'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { listFilesRecursive, relFiles, runFixtureExport } from './helpers/export'

/**
 * The `.ajmeta` files (`data.ajmeta` / `assets.ajmeta`) record which files an
 * export owns so the next export into the same folders can delete the ones it
 * no longer produces. This exports the `player` fixture, deletes a bone from
 * the still-open project, re-exports, and checks the stale bone's model file is
 * gone while the rest stays.
 */
describe('.ajmeta incremental export', () => {
	it('removes files an export no longer produces and keeps a valid ajmeta', async () => {
		const run = await runFixtureExport({ fixture: 'test_blueprints/player.ajblueprint' })
		try {
			expect(run.ok).toBe(true)

			const modelPrefix = `assets/aj/models/blueprint/player/`
			const modelsAfterFirst = relFiles(run.resourcePackFolder).filter(
				f => f.startsWith(modelPrefix) && f.endsWith('.json')
			)
			expect(modelsAfterFirst.length).toBeGreaterThan(1)

			// Both ajmeta files exist and list the export.
			const readAjmeta = (folder: string, name: string) =>
				JSON.parse(fs.readFileSync(path.join(folder, name), 'utf-8'))
			const dataAjmeta = readAjmeta(run.dataPackFolder, 'data.ajmeta')
			const assetsAjmeta = readAjmeta(run.resourcePackFolder, 'assets.ajmeta')
			expect(dataAjmeta.formatVersion).toBe('1.0.0')
			expect(dataAjmeta.rigs['aj:player'].versionedFiles.length).toBeGreaterThan(0)
			expect(assetsAjmeta.rigs['aj:player'].versionedFiles.length).toBeGreaterThan(0)

			// Delete one *leaf* bone (cubes but no child bones, so exactly one
			// model file goes away) from the still-open project, then re-export.
			const removed = await blockbench.evaluate(() => {
				const victim = Group.all.find(
					group =>
						group.name !== 'root' &&
						group.children.some((c: any) => c instanceof Cube) &&
						!group.children.some((c: any) => c instanceof Group)
				)
				const name = victim?.name
				victim?.remove()
				return name
			})
			expect(removed).toBeTruthy()

			const reExport = await blockbench.evaluate(() =>
				(window as any).AnimatedJava.exportProject()
			)
			expect(reExport).toBe(true)

			const modelsAfterSecond = relFiles(run.resourcePackFolder).filter(
				f => f.startsWith(modelPrefix) && f.endsWith('.json')
			)
			// A bone's models are `<bone>.json`, plus `<bone>/...` for Texture Slot faces.
			const ownsBone = (files: string[], bone: string) =>
				files.some(f => f.endsWith(`/${bone}.json`) || f.includes(`/${bone}/`))

			// The first export owned the bone; the second no longer does.
			expect(ownsBone(modelsAfterFirst, removed!)).toBe(true)
			expect(ownsBone(modelsAfterSecond, removed!)).toBe(false)
			// Files were removed, not everything wiped, and a kept bone survives.
			expect(modelsAfterSecond.length).toBeLessThan(modelsAfterFirst.length)
			expect(modelsAfterSecond.length).toBeGreaterThan(0)
			const survivor = modelsAfterFirst
				.map(f =>
					f
						.slice(modelPrefix.length)
						.split('/')[0]
						.replace(/\.json$/, '')
				)
				.find(name => name !== removed)!
			expect(ownsBone(modelsAfterSecond, survivor)).toBe(true)

			// ajmeta was rewritten and no longer lists the stale file.
			const assetsAjmeta2 = readAjmeta(run.resourcePackFolder, 'assets.ajmeta')
			expect(
				assetsAjmeta2.rigs['aj:player'].versionedFiles.some((f: string) =>
					f.endsWith(`/models/blueprint/player/${removed}.json`)
				)
			).toBe(false)
		} finally {
			run.cleanup()
		}
	}, 240_000)

	it('only writes files whose content changed', async () => {
		const run = await runFixtureExport({ fixture: 'test_blueprints/player.ajblueprint' })
		try {
			expect(run.ok).toBe(true)

			// Backdate every exported file, so any later write shows up as a newer mtime.
			const backdatedTime = new Date(1_000_000_000_000)
			const backdate = (folder: string) => {
				for (const file of listFilesRecursive(folder))
					fs.utimesSync(file, backdatedTime, backdatedTime)
			}
			const touched = (folder: string) =>
				relFiles(folder).filter(
					f => fs.statSync(path.join(folder, f)).mtimeMs !== backdatedTime.getTime()
				)
			const reExport = () =>
				blockbench.evaluate(() => (window as any).AnimatedJava.exportProject())

			backdate(run.dataPackFolder)
			backdate(run.resourcePackFolder)
			expect(await reExport()).toBe(true)
			expect(touched(run.dataPackFolder)).toEqual([])
			expect(touched(run.resourcePackFolder)).toEqual([])

			const removed = await blockbench.evaluate(() => {
				const victim = Group.all.find(
					group =>
						group.name !== 'root' &&
						group.children.some((c: any) => c instanceof Cube) &&
						!group.children.some((c: any) => c instanceof Group)
				)
				const name = victim?.name
				victim?.remove()
				return name
			})
			expect(removed).toBeTruthy()

			const dataFilesBefore = relFiles(run.dataPackFolder).length
			expect(await reExport()).toBe(true)
			// Only the asset list changes; the other bones' models and the textures stay put.
			expect(touched(run.resourcePackFolder)).toEqual(['assets.ajmeta'])
			// Functions referencing the bone change, but most of the data pack doesn't.
			const touchedData = touched(run.dataPackFolder)
			expect(touchedData).toContain('data.ajmeta')
			expect(touchedData.length).toBeLessThan(dataFilesBefore / 2)
		} finally {
			run.cleanup()
		}
	}, 240_000)
})
