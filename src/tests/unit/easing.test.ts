import { describe, expect, it } from '@jest/globals'
import {
	EASING_DEFAULT,
	EASING_OPTIONS,
	easingFunctions,
	getEasingArgDefault,
	hasArgs,
	parseEasingArg,
} from '../../util/easing'

// Eases that map the unit interval to itself exactly at the endpoints.
const EXACT_ENDPOINT_EASES = [
	'linear',
	'easeInQuad',
	'easeOutQuad',
	'easeInOutQuad',
	'easeInCubic',
	'easeOutCubic',
	'easeInOutCubic',
	'easeInQuart',
	'easeOutQuart',
	'easeInOutQuart',
	'easeInQuint',
	'easeOutQuint',
	'easeInOutQuint',
	'easeInSine',
	'easeOutSine',
	'easeInOutSine',
	'easeInCirc',
	'easeOutCirc',
	'easeInOutCirc',
] as const

describe('easingFunctions', () => {
	it('linear is the identity', () => {
		expect(easingFunctions.linear(0)).toBe(0)
		expect(easingFunctions.linear(0.25)).toBe(0.25)
		expect(easingFunctions.linear(1)).toBe(1)
	})

	it.each(EXACT_ENDPOINT_EASES)('%s pins both endpoints and stays monotone-ish', name => {
		const fn = easingFunctions[name]
		expect(fn(0)).toBeCloseTo(0, 6)
		expect(fn(1)).toBeCloseTo(1, 6)
		// Midpoint is a real number strictly inside a sane band.
		const mid = fn(0.5)
		expect(Number.isFinite(mid)).toBe(true)
		expect(mid).toBeGreaterThan(-0.5)
		expect(mid).toBeLessThan(1.5)
	})

	it('exponential eases hit the endpoints within Minecraft-irrelevant epsilon', () => {
		expect(easingFunctions.easeInExpo(0)).toBeCloseTo(0, 2)
		expect(easingFunctions.easeOutExpo(1)).toBeCloseTo(1, 2)
		expect(easingFunctions.easeInOutExpo(0)).toBeCloseTo(0, 2)
		expect(easingFunctions.easeInOutExpo(1)).toBeCloseTo(1, 2)
	})

	it('step() snaps to evenly spaced intervals and never overshoots', () => {
		const step = easingFunctions.step
		expect(step(5, 0)).toBe(0)
		// Every sample lands on a multiple of 1/steps in [0, 1).
		for (let x = 0; x <= 1; x += 0.05) {
			const v = step(5, x)
			expect(v).toBeGreaterThanOrEqual(0)
			expect(v).toBeLessThan(1)
			expect(Math.round(v * 5)).toBeCloseTo(v * 5, 6)
		}
	})

	it('parametric eases (back / elastic / bounce) return finite numbers', () => {
		for (const name of ['easeInBack', 'easeOutBack', 'easeInOutBack'] as const) {
			expect(Number.isFinite((easingFunctions[name] as any)(1.70158, 0.5))).toBe(true)
		}
		for (const name of ['easeInElastic', 'easeOutElastic', 'easeInOutElastic'] as const) {
			expect(Number.isFinite((easingFunctions[name] as any)(1, 0.5))).toBe(true)
		}
		for (const name of ['easeInBounce', 'easeOutBounce', 'easeInOutBounce'] as const) {
			expect(Number.isFinite((easingFunctions[name] as any)(0.25, 0.5))).toBe(true)
		}
	})
})

describe('EASING_OPTIONS', () => {
	it('mirrors easingFunctions key-for-key with identity values', () => {
		expect(Object.keys(EASING_OPTIONS).sort()).toEqual(Object.keys(easingFunctions).sort())
		for (const [key, value] of Object.entries(EASING_OPTIONS)) {
			expect(value).toBe(key)
		}
	})

	it('is frozen', () => {
		expect(Object.isFrozen(EASING_OPTIONS)).toBe(true)
	})

	it('the default is a real option', () => {
		expect(EASING_DEFAULT).toBe('linear')
		expect(EASING_OPTIONS[EASING_DEFAULT]).toBe('linear')
	})
})

describe('getEasingArgDefault', () => {
	it('supplies a starting arg only for parametric eases', () => {
		expect(getEasingArgDefault('easeInBack')).toBe(1)
		expect(getEasingArgDefault('easeOutElastic')).toBe(1)
		expect(getEasingArgDefault('easeInOutBounce')).toBe(0.25)
		expect(getEasingArgDefault('step')).toBe(5)
		expect(getEasingArgDefault('linear')).toBeUndefined()
		expect(getEasingArgDefault('easeInOutSine')).toBeUndefined()
	})
})

describe('parseEasingArg', () => {
	it('parses floats for back / elastic / bounce', () => {
		expect(parseEasingArg('easeInBack', '1.5')).toBe(1.5)
		expect(parseEasingArg('easeOutBounce', '0.3')).toBeCloseTo(0.3)
	})

	it('clamps step count to a minimum of 2', () => {
		expect(parseEasingArg('step', '10')).toBe(10)
		expect(parseEasingArg('step', '1')).toBe(2)
		expect(parseEasingArg('step', '0')).toBe(2)
	})

	it('parses an int for everything else', () => {
		expect(parseEasingArg('linear', '3.9')).toBe(3)
	})
})

describe('hasArgs', () => {
	it('is true for parametric eases and step, false otherwise', () => {
		expect(hasArgs('easeInBack')).toBe(true)
		expect(hasArgs('easeOutElastic')).toBe(true)
		expect(hasArgs('easeInOutBounce')).toBe(true)
		expect(hasArgs('step')).toBe(true)
		expect(hasArgs('linear')).toBe(false)
		expect(hasArgs('easeInOutCubic')).toBe(false)
		expect(hasArgs()).toBe(false)
	})
})
