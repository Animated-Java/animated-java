import { describe, expect, it } from '@jest/globals'
import { blockbench } from '@snavesutit/jestbench'

/**
 * Converting a model from another format to a Blueprint must give its bones the properties a
 * Blueprint adds. Blockbench redraws the model mid-conversion, and AJ's cube preview reads a
 * bone's `configs`, so a bone without them used to abort the conversion half way.
 */
const BLUEPRINT_FORMAT_ID = 'animated-java:format/blueprint'

describe('Converting to a Blueprint', () => {
	it('converts a Java Block model with bones, adding their Blueprint properties', async () => {
		const result = await blockbench.evaluate(
			(args: { formatId: string }) => {
				const g = globalThis as any
				g.newProject(g.Formats.java_block)
				const bone = new Group({ name: 'Left Arm' }).init()
				new Cube({ name: 'cube', from: [0, 0, 0], to: [2, 2, 2] }).addTo(bone).init()
				const before = { configs: (bone as any).configs }

				let error: string | undefined
				try {
					g.Formats[args.formatId].convertTo()
				} catch (e) {
					error = String(e)
				}
				const converted = Group.all[0] as any
				return {
					before,
					error,
					format: Format.id,
					hasDefaultConfig: !!converted.configs?.default,
					variants: converted.configs?.variants,
					itemModelProperties: converted.itemModelProperties,
					onSummonFunction: converted.onSummonFunction,
					// Set by AJ's own conversion step, which runs after Blockbench's.
					name: converted.name,
				}
			},
			{ formatId: BLUEPRINT_FORMAT_ID }
		)

		expect(result.before.configs).toBeUndefined()
		expect(result.error).toBeUndefined()
		expect(result.format).toBe(BLUEPRINT_FORMAT_ID)
		expect(result.hasDefaultConfig).toBe(true)
		expect(result.variants).toEqual({})
		expect(result.itemModelProperties).toEqual({ tints: [] })
		expect(result.onSummonFunction).toBe('')
		expect(result.name).toBe('left_arm')
	})
})
