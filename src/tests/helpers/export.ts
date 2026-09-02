import { blockbench } from '@snavesutit/jestbench'
import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'

const BLUEPRINT_FORMAT_ID = 'animated-java:format/blueprint'

export function repoPath(...parts: string[]): string {
	return path.resolve(process.cwd(), ...parts)
}

export function listFilesRecursive(dir: string): string[] {
	if (!fs.existsSync(dir)) return []
	const out: string[] = []
	for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
		const full = path.join(dir, entry.name)
		if (entry.isDirectory()) out.push(...listFilesRecursive(full))
		else out.push(full)
	}
	return out
}

/** Repo-relative, forward-slash paths under `dir`. */
export function relFiles(dir: string): string[] {
	return listFilesRecursive(dir).map(f => path.relative(dir, f).split(path.sep).join('/'))
}

export interface ExportRun {
	ok: boolean
	blueprintId: string
	targetVersion: string
	workDir: string
	dataPackFolder: string
	resourcePackFolder: string
	cleanup(): void
}

export interface ExportOptions {
	/** Repo-relative fixture path, e.g. `test_blueprints/player.ajblueprint`. */
	fixture: string
	targetVersion?: string
}

/**
 * Loads a committed blueprint fixture, points its data/resource pack at fresh
 * temp folders, runs a real folder-mode `exportProject`, and hands back the
 * paths. Call `cleanup()` when done.
 */
export async function runFixtureExport(options: ExportOptions): Promise<ExportRun> {
	const workDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aj-export-'))
	const dataPackFolder = path.join(workDir, 'datapack')
	const resourcePackFolder = path.join(workDir, 'resourcepack')
	for (const folder of [dataPackFolder, resourcePackFolder]) {
		fs.mkdirSync(folder)
		fs.writeFileSync(
			path.join(folder, 'pack.mcmeta'),
			JSON.stringify({ pack: { pack_format: 48, description: 'aj test' } })
		)
	}

	const raw = fs.readFileSync(repoPath(options.fixture), 'utf-8')

	const result = await blockbench.evaluate(
		async (args: {
			formatId: string
			raw: string
			fixturePath: string
			dataPackFolder: string
			resourcePackFolder: string
			targetVersion?: string
		}) => {
			const aj = (window as any).AnimatedJava
			const codec = aj.BLUEPRINT_CODEC.get()
			const g = globalThis as any

			g.newProject(g.Formats[args.formatId])
			codec.load(JSON.parse(args.raw), {
				name: 'fixture.ajblueprint',
				path: args.fixturePath,
				no_file: true,
			})

			const settings = Project.animated_java
			settings.enable_plugin_mode = false
			settings.enable_advanced_data_pack_settings = true
			settings.enable_advanced_resource_pack_settings = true
			settings.data_pack_export_mode = 'folder'
			settings.resource_pack_export_mode = 'folder'
			settings.data_pack = args.dataPackFolder
			settings.resource_pack = args.resourcePackFolder
			if (args.targetVersion) settings.target_minecraft_version = args.targetVersion

			const ok = await aj.exportProject()
			return {
				ok,
				blueprintId: settings.blueprint_id as string,
				targetVersion: settings.target_minecraft_version as string,
			}
		},
		{
			formatId: BLUEPRINT_FORMAT_ID,
			raw,
			fixturePath: repoPath(options.fixture),
			dataPackFolder,
			resourcePackFolder,
			targetVersion: options.targetVersion,
		}
	)

	return {
		...result,
		workDir,
		dataPackFolder,
		resourcePackFolder,
		cleanup: () => fs.rmSync(workDir, { recursive: true, force: true }),
	}
}
