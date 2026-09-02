import { describe, expect, it, jest } from '@jest/globals'
import { Stopwatch } from '../../util/stopwatch'

describe('Stopwatch', () => {
	it('start() returns the instance for chaining', () => {
		const sw = new Stopwatch('t')
		expect(sw.start()).toBe(sw)
	})

	it('throws when started twice', () => {
		const sw = new Stopwatch('t').start()
		expect(() => sw.start()).toThrow('already started')
	})

	it('throws when stopped before being started', () => {
		expect(() => new Stopwatch('t').stop()).toThrow('not started')
	})

	it('stop() returns a non-negative elapsed time in ms', () => {
		const sw = new Stopwatch('t').start()
		const elapsed = sw.stop()
		expect(typeof elapsed).toBe('number')
		expect(elapsed).toBeGreaterThanOrEqual(0)
	})

	describe('Stopwatch.function', () => {
		it('returns a synchronous function result unchanged', () => {
			jest.spyOn(console, 'log').mockImplementation(() => undefined)
			const wrapped = Stopwatch.function('add', (a: number, b: number) => a + b)
			expect(wrapped(2, 3)).toBe(5)
			jest.restoreAllMocks()
		})

		it('resolves to the awaited value for an async function', async () => {
			jest.spyOn(console, 'log').mockImplementation(() => undefined)
			const wrapped = Stopwatch.function('later', async () => {
				await Promise.resolve()
				return 'done'
			})
			await expect(wrapped()).resolves.toBe('done')
			jest.restoreAllMocks()
		})
	})
})
