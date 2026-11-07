import { afterAll, beforeAll, describe, expect, it } from '@jest/globals'
import { blockbench } from '@snavesutit/jestbench'
import { unzipSync } from 'fflate'
import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'
import { relFiles, repoPath } from './helpers/export'

const BLUEPRINT_FORMAT_ID = 'animated-java:format/blueprint'
const WORK_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'aj-collection-'))
const COLLECTION_PATH = path.join(WORK_DIR, 'mobs.bpcollection')
const DATA_PACK = path.join(WORK_DIR, 'dp')
const RESOURCE_PACK = path.join(WORK_DIR, 'rp')

const blueprintPath = (name: string) => path.join(WORK_DIR, `${name}.ajblueprint`)
const readJSON = (file: string) => JSON.parse(fs.readFileSync(file, 'utf-8'))
const modelFolder = (id: string) => `assets/aj/models/blueprint/${id}/`

const FOLDER_SETTINGS = {
	target_minecraft_version: '1.21.4',
	resource_pack_export_mode: 'folder',
	data_pack_export_mode: 'folder',
	resource_pack: './rp',
	data_pack: './dp',
}

/**
 * Saves the `player` fixture under `name`, in the current format, with its own blueprint ID.
 * Done through Blockbench so the file is what a user's save would hold.
 */
async function writeBlueprint(name: string, blueprintId = `aj:${name}`) {
	const raw = fs.readFileSync(repoPath('test_blueprints/player.ajblueprint'), 'utf-8')
	const compiled = await blockbench.evaluate(
		async (args: { formatId: string; raw: string; path: string; blueprintId: string }) => {
			const g = globalThis as any
			const codec = (window as any).AnimatedJava.BLUEPRINT_CODEC.get()
			g.newProject(g.Formats[args.formatId])
			codec.load(JSON.parse(args.raw), { name: 'fixture', path: args.path, no_file: true })
			Project!.animated_java.blueprint_id = args.blueprintId
			Project!.last_used_blueprint_id = args.blueprintId
			const json = codec.compile() as string
			await Project!.close(true)
			return json
		},
		{ formatId: BLUEPRINT_FORMAT_ID, raw, path: blueprintPath(name), blueprintId }
	)
	fs.writeFileSync(blueprintPath(name), compiled)
}

/**
 * Opens the collection in its tab, sets its settings and members, saves it and closes the tab.
 * @returns Whether it saved.
 */
async function saveCollection(settings: Record<string, string>, members: string[]) {
	return blockbench.evaluate(
		async (args: { path: string; settings: Record<string, string>; members: string[] }) => {
			const aj = (window as any).AnimatedJava
			aj.openCollection(args.path)
			const project = Project!
			project.collection!.settings = { ...project.collection!.settings, ...args.settings }
			project.collection!.members = args.members
			const saved = aj.saveCollectionProject(project, project.save_path) as boolean
			await project.close(true)
			return saved
		},
		{ path: COLLECTION_PATH, settings, members: members.map(blueprintPath) }
	)
}

async function exportCollection() {
	return blockbench.evaluate(
		async (args: { path: string }) => {
			const aj = (window as any).AnimatedJava
			const before = ModelProject.all.length
			const ok = (await aj.exportCollection(aj.getCollection(args.path))) as boolean
			return { ok, leftOpen: ModelProject.all.length - before }
		},
		{ path: COLLECTION_PATH }
	)
}

function makePack(folder: string) {
	fs.rmSync(folder, { recursive: true, force: true })
	fs.mkdirSync(folder)
	fs.writeFileSync(
		path.join(folder, 'pack.mcmeta'),
		JSON.stringify({ pack: { pack_format: 48, description: 'aj test' } })
	)
}

describe('Blueprint Collections', () => {
	beforeAll(async () => {
		makePack(DATA_PACK)
		makePack(RESOURCE_PACK)
		for (const name of ['alpha', 'beta', 'gamma']) await writeBlueprint(name)
		await writeBlueprint('alpha_twin', 'aj:alpha')
		fs.writeFileSync(
			COLLECTION_PATH,
			JSON.stringify({ format_version: 1, uuid: 'test-collection', blueprints: [] })
		)
	}, 300_000)

	afterAll(() => fs.rmSync(WORK_DIR, { recursive: true, force: true }))

	it('links members and exports them into one pack, closing what it opened', async () => {
		expect(await saveCollection(FOLDER_SETTINGS, ['alpha', 'beta'])).toBe(true)
		expect(readJSON(blueprintPath('alpha')).blueprint_settings.collection).toBe(
			'./mobs.bpcollection'
		)
		expect(readJSON(COLLECTION_PATH).blueprints).toEqual([
			'./alpha.ajblueprint',
			'./beta.ajblueprint',
		])

		const result = await exportCollection()
		expect(result).toEqual({ ok: true, leftOpen: 0 })

		const { uuid } = readJSON(COLLECTION_PATH)
		const dataMeta = readJSON(path.join(DATA_PACK, 'data.ajmeta'))
		expect(dataMeta.rigs['aj:alpha'].collection).toBe(uuid)
		expect(dataMeta.rigs['aj:beta'].collection).toBe(uuid)
		const files = relFiles(RESOURCE_PACK)
		expect(files.some(f => f.startsWith(modelFolder('alpha')))).toBe(true)
		expect(files.some(f => f.startsWith(modelFolder('beta')))).toBe(true)
	}, 300_000)

	it('exports a lone member with the collection settings, not its own', async () => {
		const elsewhere = path.join(WORK_DIR, 'elsewhere')
		makePack(elsewhere)
		const ok = await blockbench.evaluate(
			async (args: { path: string; raw: string; elsewhere: string }) => {
				const aj = (window as any).AnimatedJava
				aj.BLUEPRINT_CODEC.get().load(JSON.parse(args.raw), {
					name: 'alpha',
					path: args.path,
					no_file: true,
				})
				Project!.animated_java.data_pack = args.elsewhere
				const exported = (await aj.exportProject()) as boolean
				await Project!.close(true)
				return exported
			},
			{
				path: blueprintPath('alpha'),
				raw: fs.readFileSync(blueprintPath('alpha'), 'utf-8'),
				elsewhere,
			}
		)
		expect(ok).toBe(true)
		expect(fs.existsSync(path.join(elsewhere, 'data.ajmeta'))).toBe(false)
	}, 300_000)

	it('removes rigs of members that left, and leaves rigs it never exported', async () => {
		// A Blueprint outside the collection, exported into the same packs.
		const standalone = await blockbench.evaluate(
			async (args: { path: string; raw: string; dp: string; rp: string }) => {
				const aj = (window as any).AnimatedJava
				aj.BLUEPRINT_CODEC.get().load(JSON.parse(args.raw), {
					name: 'gamma',
					path: args.path,
					no_file: true,
				})
				Object.assign(Project!.animated_java, {
					target_minecraft_version: '1.21.4',
					data_pack_export_mode: 'folder',
					resource_pack_export_mode: 'folder',
					data_pack: args.dp,
					resource_pack: args.rp,
				})
				const exported = (await aj.exportProject()) as boolean
				await Project!.close(true)
				return exported
			},
			{
				path: blueprintPath('gamma'),
				raw: fs.readFileSync(blueprintPath('gamma'), 'utf-8'),
				dp: DATA_PACK,
				rp: RESOURCE_PACK,
			}
		)
		expect(standalone).toBe(true)

		await saveCollection(FOLDER_SETTINGS, ['alpha'])
		expect(readJSON(blueprintPath('beta')).blueprint_settings.collection).toBe('')

		expect((await exportCollection()).ok).toBe(true)

		const dataMeta = readJSON(path.join(DATA_PACK, 'data.ajmeta'))
		const assetsMeta = readJSON(path.join(RESOURCE_PACK, 'assets.ajmeta'))
		for (const meta of [dataMeta, assetsMeta]) {
			expect(Object.keys(meta.rigs).sort()).toEqual(['aj:alpha', 'aj:gamma'])
		}
		const files = relFiles(RESOURCE_PACK)
		expect(files.some(f => f.startsWith(modelFolder('beta')))).toBe(false)
		expect(files.some(f => f.startsWith(modelFolder('gamma')))).toBe(true)
		const dataFiles = relFiles(DATA_PACK)
		expect(dataFiles.some(f => f.includes('/beta/'))).toBe(false)
		expect(dataFiles.some(f => f.includes('/gamma/'))).toBe(true)
	}, 300_000)

	it('writes the link into an open member file, so closing it unsaved keeps it', async () => {
		await blockbench.evaluate(
			(args: { path: string; raw: string }) => {
				const aj = (window as any).AnimatedJava
				aj.BLUEPRINT_CODEC.get().load(JSON.parse(args.raw), {
					name: 'beta',
					path: args.path,
					no_file: true,
				})
			},
			{ path: blueprintPath('beta'), raw: fs.readFileSync(blueprintPath('beta'), 'utf-8') }
		)
		await saveCollection(FOLDER_SETTINGS, ['alpha', 'beta'])
		const saved = await blockbench.evaluate(async () => {
			const project = Project!
			const wasSaved = project.saved
			await project.close(true)
			return wasSaved
		})
		expect(saved).toBe(true)
		expect(readJSON(blueprintPath('beta')).blueprint_settings.collection).toBe(
			'./mobs.bpcollection'
		)
	}, 300_000)

	it('zips every member into one pack per zip', async () => {
		await saveCollection(
			{
				...FOLDER_SETTINGS,
				resource_pack_export_mode: 'zip',
				data_pack_export_mode: 'zip',
				resource_pack: './rp.zip',
				data_pack: './dp.zip',
			},
			['alpha', 'beta']
		)
		expect((await exportCollection()).ok).toBe(true)

		const rp = Object.keys(unzipSync(fs.readFileSync(path.join(WORK_DIR, 'rp.zip'))))
		const dp = Object.keys(unzipSync(fs.readFileSync(path.join(WORK_DIR, 'dp.zip'))))
		expect(rp.some(f => f.startsWith(modelFolder('alpha')))).toBe(true)
		expect(rp.some(f => f.startsWith(modelFolder('beta')))).toBe(true)
		expect(rp).toContain('pack.mcmeta')
		expect(dp).toContain('pack.mcmeta')
		expect([...rp, ...dp].some(f => f.endsWith('.ajmeta'))).toBe(false)
	}, 300_000)

	it('refuses to export members that share a blueprint ID', async () => {
		await saveCollection(FOLDER_SETTINGS, ['alpha', 'alpha_twin'])
		const before = fs.statSync(path.join(DATA_PACK, 'data.ajmeta')).mtimeMs
		const result = await exportCollection()
		expect(result).toEqual({ ok: false, leftOpen: 0 })
		expect(fs.statSync(path.join(DATA_PACK, 'data.ajmeta')).mtimeMs).toBe(before)
	}, 300_000)

	it('refuses to add a plugin mode Blueprint', async () => {
		const model = readJSON(blueprintPath('gamma'))
		model.blueprint_settings.enable_plugin_mode = true
		fs.writeFileSync(blueprintPath('gamma'), JSON.stringify(model))
		expect(await saveCollection(FOLDER_SETTINGS, ['alpha', 'gamma'])).toBe(false)
		expect(readJSON(COLLECTION_PATH).blueprints).not.toContain('./gamma.ajblueprint')
		expect(readJSON(blueprintPath('gamma')).blueprint_settings.collection ?? '').toBe('')
	}, 300_000)

	it('opens in its own tab and mode, showing a card per member', async () => {
		const result = await blockbench.evaluate(
			async (args: { path: string }) => {
				const aj = (window as any).AnimatedJava
				aj.openCollection(args.path)
				const project = Project!
				const panel = (globalThis as any).Panels['animated_java:collection-settings']
				const state = {
					format: project.format.id,
					mode: Modes.selected && (Modes.selected as Mode).id,
					tool: Toolbox.selected?.id,
					panelShown: Condition(panel.condition),
					cards: document.querySelectorAll('.collection-page .card').length,
					closedBadges: document.querySelectorAll('.collection-page .badge.closed')
						.length,
					saved: project.saved,
				}
				await project.close(true)
				return state
			},
			{ path: COLLECTION_PATH }
		)
		expect(result).toEqual({
			format: 'animated-java:format/collection',
			mode: 'animated_java:collection',
			tool: 'animated_java:collection_tool',
			panelShown: true,
			cards: readJSON(COLLECTION_PATH).blueprints.length,
			closedBadges: 0,
			saved: true,
		})
	}, 300_000)

	it('saves unsaved tab edits before exporting from the tab', async () => {
		const result = await blockbench.evaluate(
			async (args: { path: string; members: string[]; settings: Record<string, string> }) => {
				const aj = (window as any).AnimatedJava
				aj.openCollection(args.path)
				const project = Project!
				project.collection!.settings = { ...project.collection!.settings, ...args.settings }
				project.collection!.members = args.members
				project.saved = false
				const ok = (await aj.exportActiveCollectionTab(false)) as boolean
				const saved = project.saved
				await project.close(true)
				return { ok, saved }
			},
			{
				path: COLLECTION_PATH,
				members: ['alpha', 'beta'].map(blueprintPath),
				settings: FOLDER_SETTINGS,
			}
		)
		expect(result).toEqual({ ok: true, saved: true })
		expect(readJSON(COLLECTION_PATH).blueprints).toEqual([
			'./alpha.ajblueprint',
			'./beta.ajblueprint',
		])
		expect(readJSON(blueprintPath('beta')).blueprint_settings.collection).toBe(
			'./mobs.bpcollection'
		)
	}, 300_000)

	it('exports a member with the open tab settings, unsaved edits included', async () => {
		const tabPack = path.join(WORK_DIR, 'dp_tab')
		makePack(tabPack)
		const ok = await blockbench.evaluate(
			async (args: { path: string; member: string; raw: string }) => {
				const aj = (window as any).AnimatedJava
				aj.openCollection(args.path)
				const tab = Project!
				tab.collection!.settings = { ...tab.collection!.settings, data_pack: './dp_tab' }
				tab.saved = false
				aj.BLUEPRINT_CODEC.get().load(JSON.parse(args.raw), {
					name: 'alpha',
					path: args.member,
					no_file: true,
				})
				const member = Project!
				const exported = (await aj.exportProject()) as boolean
				await member.close(true)
				await tab.close(true)
				return exported
			},
			{
				path: COLLECTION_PATH,
				member: blueprintPath('alpha'),
				raw: fs.readFileSync(blueprintPath('alpha'), 'utf-8'),
			}
		)
		expect(ok).toBe(true)
		expect(fs.existsSync(path.join(tabPack, 'data.ajmeta'))).toBe(true)
	}, 300_000)

	it('relinks every member when saved to a new path', async () => {
		const moved = path.join(WORK_DIR, 'moved.bpcollection')
		const saved = await blockbench.evaluate(
			async (args: { path: string; moved: string }) => {
				const aj = (window as any).AnimatedJava
				aj.openCollection(args.path)
				const project = Project!
				const ok = aj.saveCollectionProject(project, args.moved) as boolean
				await project.close(true)
				return ok
			},
			{ path: COLLECTION_PATH, moved }
		)
		expect(saved).toBe(true)
		expect(readJSON(moved).blueprints).toEqual(['./alpha.ajblueprint', './beta.ajblueprint'])
		for (const name of ['alpha', 'beta']) {
			expect(readJSON(blueprintPath(name)).blueprint_settings.collection).toBe(
				'./moved.bpcollection'
			)
		}
	}, 300_000)

	it('edits members from the page: drag to reorder, remove from the right-click menu', async () => {
		const result = await blockbench.evaluate(
			async (args: { path: string }) => {
				const aj = (window as any).AnimatedJava
				aj.openCollection(args.path)
				const project = Project!
				const tick = () => new Promise(resolve => requestAnimationFrame(resolve))
				const cards = () => [...document.querySelectorAll('.collection-page .card')]
				const names = () => project.collection!.members.map(m => m.split('/').pop())
				// Let the page lay out before measuring the cards.
				await new Promise(resolve => setTimeout(resolve, 300))

				// svelte-dnd-action drags on mouse events: press the first card, move past the second.
				const [first, second] = cards().map(card => card.getBoundingClientRect())
				const y = first.top + first.height / 2
				cards()[0].dispatchEvent(
					new MouseEvent('mousedown', {
						clientX: first.left + 20,
						clientY: y,
						bubbles: true,
					})
				)
				for (let step = 1; step <= 20; step++) {
					const x = first.left + 20 + ((second.right - first.left) * step) / 20
					window.dispatchEvent(
						new MouseEvent('mousemove', { clientX: x, clientY: y, buttons: 1 })
					)
					await new Promise(resolve => setTimeout(resolve, 30))
				}
				// The library checks the dragged card's position on an interval, not on every move.
				await new Promise(resolve => setTimeout(resolve, 400))
				window.dispatchEvent(new MouseEvent('mouseup'))
				await new Promise(resolve => setTimeout(resolve, 500))
				const reordered = names()

				cards()[0].dispatchEvent(new MouseEvent('contextmenu', { bubbles: true }))
				await tick()
				const remove = [...document.querySelectorAll<HTMLElement>('.contextMenu li')].find(
					item => item.textContent?.includes('Remove from Collection')
				)!
				remove.click()
				await tick()
				const state = { reordered, afterRemove: names(), saved: project.saved }
				await project.close(true)
				return state
			},
			{ path: path.join(WORK_DIR, 'moved.bpcollection') }
		)
		expect(result).toEqual({
			reordered: ['beta.ajblueprint', 'alpha.ajblueprint'],
			afterRemove: ['alpha.ajblueprint'],
			saved: false,
		})
	}, 300_000)

	it('changes a member blueprint ID inline from the right-click menu', async () => {
		const result = await blockbench.evaluate(
			async (args: { path: string }) => {
				const aj = (window as any).AnimatedJava
				aj.openCollection(args.path)
				const project = Project!
				const tick = () => new Promise(resolve => requestAnimationFrame(resolve))
				const card = () => document.querySelector('.collection-page .card')!
				const input = () => card().querySelector('input')
				const type = async (value: string) => {
					input()!.value = value
					input()!.dispatchEvent(new Event('input', { bubbles: true }))
					await tick()
				}
				const press = async (key: string) => {
					input()!.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }))
					await tick()
				}
				await new Promise(resolve => setTimeout(resolve, 300))

				card().dispatchEvent(new MouseEvent('contextmenu', { bubbles: true }))
				await tick()
				const change = [...document.querySelectorAll<HTMLElement>('.contextMenu li')].find(
					item => item.textContent?.includes('Change Blueprint ID')
				)!
				change.click()
				await tick()
				const field = input()!
				const opened = {
					value: field.value,
					focused: document.activeElement === field,
					selected:
						field.selectionStart === 0 && field.selectionEnd === field.value.length,
				}

				await type('aj:beta')
				await press('Enter')
				const duplicate = {
					editing: !!input(),
					error: card().querySelector('.error-text')?.textContent,
				}

				await type('aj:alpha_renamed')
				await press('Enter')
				const state = {
					opened,
					duplicate,
					shown: card().querySelector('code')?.textContent,
					saved: project.saved,
				}
				await project.close(true)
				return state
			},
			{ path: path.join(WORK_DIR, 'moved.bpcollection') }
		)
		expect(result).toEqual({
			opened: { value: 'aj:alpha', focused: true, selected: true },
			duplicate: {
				editing: true,
				error: 'Another Blueprint in this collection already uses this ID.',
			},
			shown: 'aj:alpha_renamed',
			saved: true,
		})
		expect(readJSON(blueprintPath('alpha')).blueprint_settings.blueprint_id).toBe(
			'aj:alpha_renamed'
		)
	}, 300_000)

	it('marks members whose saved blueprint ID is invalid or shared', async () => {
		const setStoredId = (name: string, id: string) => {
			const model = readJSON(blueprintPath(name))
			model.blueprint_settings.blueprint_id = id
			fs.writeFileSync(blueprintPath(name), JSON.stringify(model))
		}
		const readCards = () =>
			blockbench.evaluate(
				async (args: { path: string }) => {
					const aj = (window as any).AnimatedJava
					aj.openCollection(args.path)
					const project = Project!
					await new Promise(resolve => setTimeout(resolve, 300))
					const cards = [...document.querySelectorAll('.collection-page .card')].map(
						card => ({
							invalid: card.classList.contains('invalid'),
							error: card.querySelector('.id-error')?.textContent?.trim(),
						})
					)
					await project.close(true)
					return cards
				},
				{ path: path.join(WORK_DIR, 'moved.bpcollection') }
			)

		setStoredId('beta', 'minecraft:beta')
		const invalid = await readCards()
		expect(invalid[0]).toEqual({ invalid: false, error: undefined })
		expect(invalid[1].invalid).toBe(true)
		expect(invalid[1].error).toContain('namespace is reserved')

		setStoredId('beta', 'aj:alpha_renamed')
		const duplicate = {
			invalid: true,
			error: 'Another Blueprint in this collection already uses this ID.',
		}
		expect(await readCards()).toEqual([duplicate, duplicate])
	}, 300_000)

	it('draws a recent-projects thumbnail when a collection opens', async () => {
		const thumbnail = await blockbench.evaluate(
			(args: { path: string }) =>
				PathModule.join(
					SystemInfo.user_data_directory,
					'thumbnails',
					`${(args.path as any).hashCode().toString().replace(/^-/, '0')}.png`
				),
			{ path: COLLECTION_PATH }
		)
		fs.rmSync(thumbnail, { force: true })
		await blockbench.evaluate(
			(args: { path: string }) => (window as any).AnimatedJava.openCollection(args.path),
			{ path: COLLECTION_PATH }
		)
		const start = Date.now()
		while (!fs.existsSync(thumbnail) && Date.now() - start < 5000) {
			await new Promise(resolve => setTimeout(resolve, 50))
		}
		await blockbench.evaluate(async () => {
			await Project!.close(true)
		})
		// A PNG's IHDR chunk holds its width and height at bytes 16 and 20.
		const png = fs.readFileSync(thumbnail)
		expect([png.readUInt32BE(16), png.readUInt32BE(20)]).toEqual([270, 150])
	}, 300_000)

	it('creates a new collection that asks to be saved before exporting', async () => {
		const result = await blockbench.evaluate(async () => {
			const aj = (window as any).AnimatedJava
			const format = (globalThis as any).Formats['animated-java:format/collection']
			format.new()
			const project = Project!
			const state = {
				mode: Modes.selected && (Modes.selected as Mode).id,
				members: project.collection!.members.length,
				exported: (await aj.exportActiveCollectionTab(false)) as boolean,
			}
			// Cancel, so the prompt doesn't open a native save dialog.
			Dialog.open?.close(1)
			await project.close(true)
			return state
		})
		expect(result).toEqual({ mode: 'animated_java:collection', members: 0, exported: false })
	}, 300_000)
})
