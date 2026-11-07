import { describe, expect, it } from '@jest/globals'
import { getRepeatSchedule, type IRepeatScheduleInput } from '../../systems/repeatSchedule'

function schedule(input: Partial<IRepeatScheduleInput>) {
	return getRepeatSchedule({
		start: 0,
		repeat: true,
		frequency: 5,
		duration: 0,
		end: 20,
		loop: false,
		...input,
	})
}

describe('getRepeatSchedule', () => {
	it('runs once when not repeating', () => {
		expect(schedule({ start: 3, repeat: false })).toEqual({
			ticks: [3],
			until: 3,
			plannedUntil: 3,
			overrun: false,
		})
	})

	it('runs once for a frequency below one tick', () => {
		expect(schedule({ frequency: 0 }).ticks).toEqual([0])
		expect(schedule({ frequency: NaN }).ticks).toEqual([0])
	})

	it('counts from the keyframe, not the animation start', () => {
		expect(schedule({ start: 3, duration: 10 }).ticks).toEqual([3, 8, 13])
	})

	it('includes the run at the end of the duration', () => {
		expect(schedule({ duration: 15 }).ticks).toEqual([0, 5, 10, 15])
	})

	it('repeats until the animation ends without a duration', () => {
		const result = schedule({ duration: 0 })
		expect(result.ticks).toEqual([0, 5, 10, 15, 20])
		expect(result.until).toBe(20)
		expect(result.cutoff).toBeUndefined()
	})

	it('stops at the next keyframe without a duration, with no cutoff', () => {
		const result = schedule({ next: 12 })
		expect(result.ticks).toEqual([0, 5, 10])
		expect(result.until).toBe(12)
		expect(result.cutoff).toBeUndefined()
	})

	it('reports a cutoff when the next keyframe replaces a run', () => {
		const result = schedule({ frequency: 4, duration: 20, next: 10, end: 40 })
		expect(result.ticks).toEqual([0, 4, 8])
		expect(result.until).toBe(10)
		expect(result.plannedUntil).toBe(20)
		expect(result.cutoff).toBe(10)
	})

	it('reports a cutoff when the next keyframe lands on a run', () => {
		expect(schedule({ duration: 10, next: 10 }).cutoff).toBe(10)
	})

	it('reports no cutoff when the next keyframe is between the last run and the end', () => {
		const result = schedule({ duration: 12, next: 11 })
		expect(result.ticks).toEqual([0, 5, 10])
		expect(result.cutoff).toBeUndefined()
	})

	it('skips the last frame on a looping animation when starting on the first', () => {
		expect(schedule({ loop: true }).ticks).toEqual([0, 5, 10, 15])
		expect(schedule({ loop: true, duration: 20 }).ticks).toEqual([0, 5, 10, 15])
	})

	it('keeps the last frame on a looping animation when starting later', () => {
		expect(schedule({ start: 10, loop: true }).ticks).toEqual([10, 15, 20])
	})

	it('flags a duration past the animation end', () => {
		const result = schedule({ start: 10, duration: 15 })
		expect(result.overrun).toBe(true)
		expect(result.ticks).toEqual([10, 15, 20])
		expect(result.plannedUntil).toBe(20)
		expect(schedule({ duration: 20 }).overrun).toBe(false)
		expect(schedule({ duration: 0 }).overrun).toBe(false)
	})
})
