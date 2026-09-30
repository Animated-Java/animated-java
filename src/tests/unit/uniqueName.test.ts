import { describe, expect, it } from '@jest/globals'
import { makeUniqueName } from '../../util/uniqueName'

describe('makeUniqueName', () => {
	it('returns the name unchanged when it is free', () => {
		expect(makeUniqueName('hat', () => false)).toBe('hat')
	})

	it('appends a numeric suffix when taken', () => {
		const taken = new Set(['hat', 'hat1'])
		expect(makeUniqueName('hat', name => taken.has(name))).toBe('hat2')
	})

	it('increments an existing numeric suffix', () => {
		const taken = new Set(['hat3'])
		expect(makeUniqueName('hat3', name => taken.has(name))).toBe('hat4')
	})

	it('throws when no free name is found', () => {
		expect(() => makeUniqueName('hat', () => true)).toThrow(/unique/)
	})
})
