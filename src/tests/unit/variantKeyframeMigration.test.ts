import { describe, expect, it } from '@jest/globals'
import {
	needsVariantKeyframeUpgrade,
	upgradeVariantKeyframes,
} from '../../formats/blueprint/versions/1.11.0'

function makeModel(dataPoints: any[]): any {
	return {
		meta: { format_version: '1.10.2' },
		animations: [
			{
				animators: {
					effects: {
						type: 'effect',
						keyframes: [
							{ channel: 'variant', data_points: dataPoints },
							{ channel: 'function', data_points: [{ function: 'say hi' }] },
						],
					},
				},
			},
		],
	}
}

describe('variant keyframe migration', () => {
	it('turns a single variant into a one-item list', () => {
		const model = makeModel([{ variant: 'red', execute_condition: 'if entity @s' }])
		expect(needsVariantKeyframeUpgrade(model)).toBe(true)

		const fixed: any = upgradeVariantKeyframes(model)
		const dataPoint = fixed.animations[0].animators.effects.keyframes[0].data_points[0]
		expect(dataPoint).toEqual({ variants: ['red'], execute_condition: 'if entity @s' })
		expect(needsVariantKeyframeUpgrade(fixed)).toBe(false)
	})

	it('turns an empty variant into an empty list', () => {
		const fixed: any = upgradeVariantKeyframes(makeModel([{ variant: '' }]))
		expect(fixed.animations[0].animators.effects.keyframes[0].data_points[0]).toEqual({
			variants: [],
		})
	})

	it('leaves other keyframes and the input untouched', () => {
		const model = makeModel([{ variant: 'red' }])
		const fixed: any = upgradeVariantKeyframes(model)
		expect(fixed.animations[0].animators.effects.keyframes[1]).toEqual(
			model.animations[0].animators.effects.keyframes[1]
		)
		expect(model.animations[0].animators.effects.keyframes[0].data_points[0]).toEqual({
			variant: 'red',
		})
	})

	it('skips models without variant keyframes', () => {
		expect(needsVariantKeyframeUpgrade({ meta: {} })).toBe(false)
		expect(needsVariantKeyframeUpgrade(makeModel([{ variants: ['red'] }]))).toBe(false)
	})
})
