import { describe, expect, it } from '@jest/globals'
import {
	detectCircularReferences,
	mapObjEntries,
	roundTo,
	roundToNth,
	scrubUndefined,
} from '../../util/misc'

describe('roundTo', () => {
	it('rounds to a number of decimal places', () => {
		expect(roundTo(3.14159, 2)).toBe(3.14)
		expect(roundTo(3.14159, 0)).toBe(3)
		expect(roundTo(2.5, 0)).toBe(3)
		expect(roundTo(-1.2345, 2)).toBe(-1.23)
	})
})

describe('roundToNth', () => {
	it('rounds to the nearest 1/n', () => {
		expect(roundToNth(0.34, 10)).toBeCloseTo(0.3)
		expect(roundToNth(1.27, 4)).toBe(1.25)
		expect(roundToNth(0.13, 4)).toBeCloseTo(0.25)
	})
})

describe('scrubUndefined', () => {
	it('drops undefined keys, recursively, and returns the same object', () => {
		const input: Record<string, any> = {
			a: 1,
			b: undefined,
			c: { d: undefined, e: 2, f: { g: undefined } },
		}
		const result = scrubUndefined(input)
		expect(result).toBe(input)
		expect(result).toEqual({ a: 1, c: { e: 2, f: {} } })
		expect('b' in result).toBe(false)
	})

	it('keeps falsy-but-defined values', () => {
		expect(scrubUndefined({ a: 0, b: '', c: false, d: null })).toEqual({
			a: 0,
			b: '',
			c: false,
			d: null,
		})
	})
})

describe('detectCircularReferences', () => {
	it('returns false for an acyclic object', () => {
		expect(detectCircularReferences({ a: { b: { c: 1 } }, d: [1, 2, 3] })).toBe(false)
	})

	it('returns true (without throwing) for a self-referential object', () => {
		const o: any = { name: 'root' }
		o.self = o
		expect(detectCircularReferences(o)).toBe(true)
	})

	it('returns true for a cycle deeper in the tree', () => {
		const a: any = {}
		const b: any = { a }
		a.b = b
		expect(detectCircularReferences({ start: a })).toBe(true)
	})

	it('does not flag a shared (diamond) reference that is not a cycle', () => {
		const shared = { x: 1 }
		expect(detectCircularReferences({ left: shared, right: shared })).toBe(false)
	})
})

describe('mapObjEntries', () => {
	it('maps keys and values', () => {
		expect(mapObjEntries({ a: 1, b: 2 }, (k, v) => [k.toUpperCase(), v * 10])).toEqual({
			A: 10,
			B: 20,
		})
	})

	it('returns an empty object for an empty input', () => {
		expect(mapObjEntries({}, (k, v) => [k, v])).toEqual({})
	})
})
