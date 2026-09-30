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

	it('exports Texture Slots, slot faces and Variant keyframes', async () => {
		const workDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aj-plugin-'))
		const jsonFile = path.join(workDir, 'blueprint.json')

		try {
			const ok = await blockbench.evaluate(
				(args: { formatId: string; jsonFile: string }) => {
					const aj = (window as any).AnimatedJava
					const g = globalThis as any
					g.newProject(g.Formats[args.formatId])

					// `.png` is stripped from texture keys
					const red = new Texture({ name: 'red.png' }, undefined).add(false)
					const blue = new Texture({ name: 'blue.png' }, undefined).add(false)
					const bone = new Group({ name: 'bone' }).init()
					const cube = new Cube({ from: [0, 0, 0], to: [4, 4, 4] }).addTo(bone).init()
					for (const face of Object.values(cube.faces) as any[]) face.texture = red.uuid

					const slot = aj.textureSlots.createTextureSlot([red, blue])
					slot.name = 'shirt'
					cube.faces.north.texture = slot.uuid
					const variant = new aj.Variant('Blue')
					variant.slotTextures.set(slot.uuid, blue.uuid)

					const anim = new Blockbench.Animation({ name: 'swap' })
					anim.add()
					anim.length = 1
					anim.animators.effects ??= new (g.EffectAnimator as any)(anim)
					const toBlue = anim.animators.effects.addKeyframe({
						channel: 'variant',
						time: 0.5,
						data_points: [{}],
					})
					toBlue.variant = variant
					const toDefault = anim.animators.effects.addKeyframe({
						channel: 'variant',
						time: 1,
						data_points: [{}],
					})
					toDefault.variant = aj.Variant.getDefault()

					const settings = Project.animated_java
					settings.blueprint_id = 'test:slots'
					settings.enable_plugin_mode = true
					settings.json_file = args.jsonFile
					return aj.exportProject()
				},
				{ formatId: BLUEPRINT_FORMAT_ID, jsonFile }
			)

			expect(ok).toBe(true)
			const json = JSON.parse(fs.readFileSync(jsonFile, 'utf-8'))
			expect(json.format_version).toBe(3)
			expect(json.texture_slots).toEqual({
				shirt: { default_texture: 'red', textures: ['red', 'blue'] },
			})
			const faces = json.nodes.bone.elements[0].faces
			expect(faces.north.texture_provider).toEqual({
				type: 'texture_slot',
				texture_slot: 'shirt',
			})
			expect(faces.south.texture_provider).toEqual({ type: 'texture', texture: 'red' })
			expect(json.animations.swap.global_keyframes.texture_slot).toEqual({
				'0.5': { shirt: 'blue' },
				'1.0': { shirt: 'red' },
			})
		} finally {
			fs.rmSync(workDir, { recursive: true, force: true })
		}
	}, 120_000)
})
