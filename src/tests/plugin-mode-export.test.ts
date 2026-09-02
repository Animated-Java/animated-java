import { describe, expect, it } from '@jest/globals'
import { blockbench } from '@snavesutit/jestbench'
import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'

/**
 * Plugin mode exports a single JSON blueprint (for other tools to consume)
 * instead of a data pack + resource pack. This drives `exportProject` with
 * `enable_plugin_mode` on and checks the written file's shape.
 */
const BLUEPRINT_FORMAT_ID = 'animated-java:format/blueprint'
const FIXTURE = path.resolve(process.cwd(), 'test_blueprints/text_display.ajblueprint')

describe('Plugin-mode export', () => {
	it('writes a single JSON blueprint file', async () => {
		const workDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aj-plugin-'))
		const jsonFile = path.join(workDir, 'nested', 'blueprint.json')

		try {
			const raw = fs.readFileSync(FIXTURE, 'utf-8')
			const ok = await blockbench.evaluate(
				(args: {
					formatId: string
					raw: string
					fixturePath: string
					jsonFile: string
				}) => {
					const aj = (window as any).AnimatedJava
					const codec = aj.BLUEPRINT_CODEC.get()
					const g = globalThis as any

					g.newProject(g.Formats[args.formatId])
					codec.load(JSON.parse(args.raw), {
						name: 'text_display.ajblueprint',
						path: args.fixturePath,
						no_file: true,
					})

					const settings = Project.animated_java
					settings.enable_plugin_mode = true
					settings.json_file = args.jsonFile
					return aj.exportProject()
				},
				{ formatId: BLUEPRINT_FORMAT_ID, raw, fixturePath: FIXTURE, jsonFile }
			)

			expect(ok).toBe(true)
			// The compiler creates missing parent directories.
			expect(fs.existsSync(jsonFile)).toBe(true)

			const json = JSON.parse(fs.readFileSync(jsonFile, 'utf-8'))
			expect(json.format_version).toBeDefined()
			expect(typeof json.settings?.id).toBe('string')
			expect(json).toHaveProperty('nodes')
			expect(json).toHaveProperty('animations')
			expect(json).toHaveProperty('textures')
			// The fixture's text-display node made it into the output.
			expect(Object.values(json.nodes).some((n: any) => n.type === 'text_display')).toBe(true)
		} finally {
			fs.rmSync(workDir, { recursive: true, force: true })
		}
	}, 120_000)
})
