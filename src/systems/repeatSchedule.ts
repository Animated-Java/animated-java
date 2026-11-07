export const TICK_RATE = 20

export interface IRepeatScheduleInput {
	/** Tick of the keyframe. */
	start: number
	repeat: boolean
	/** Ticks between runs. */
	frequency: number
	/** Ticks to keep repeating after `start`. `0` repeats until `next` or `end`. */
	duration: number
	/** Tick of the next function keyframe on the same animator. */
	next?: number
	/** Last tick of the animation. */
	end: number
	loop: boolean
}

export interface IRepeatSchedule {
	/** Ticks the function runs on, starting with the keyframe's own. */
	ticks: number[]
	/** Last tick the repeats cover, up to the next keyframe. `start` when not repeating. */
	until: number
	/** Last tick the repeats would cover without the next keyframe. */
	plannedUntil: number
	/** Tick of the next keyframe, when it replaces at least one run. */
	cutoff?: number
	/** Whether a set duration runs past the end of the animation. */
	overrun: boolean
}

/**
 * Lists the ticks a function keyframe runs on.
 *
 * Runs are inclusive of `start + duration`, except at the seam of a looping animation: a
 * keyframe on the first frame never also runs on the last, since the game plays both in the
 * same tick when it loops.
 */
export function getRepeatSchedule(input: IRepeatScheduleInput): IRepeatSchedule {
	const { start, frequency, duration, next, end, loop } = input
	if (!input.repeat || !(frequency >= 1) || start > end) {
		return { ticks: [start], until: start, plannedUntil: start, overrun: false }
	}

	const step = Math.round(frequency)
	const span = Math.max(0, Math.round(duration))
	const plannedUntil = span > 0 ? Math.min(start + span, end) : end
	const seam = loop && start === 0

	const ticks: number[] = []
	let cutoff: number | undefined
	for (let tick = start; tick <= plannedUntil; tick += step) {
		if (seam && tick === end && tick !== start) break
		if (next !== undefined && tick >= next) {
			if (span > 0) cutoff = next
			break
		}
		ticks.push(tick)
	}

	return {
		ticks,
		until: next !== undefined ? Math.min(plannedUntil, next) : plannedUntil,
		plannedUntil,
		cutoff,
		overrun: span > 0 && start + span > end,
	}
}

/** Tick a keyframe sits on. */
export function getKeyframeTick(keyframe: _Keyframe) {
	return Math.round(keyframe.time * TICK_RATE)
}

/** {@link getRepeatSchedule} for a function keyframe in its animation. */
export function getKeyframeRepeatSchedule(keyframe: _Keyframe): IRepeatSchedule {
	const start = getKeyframeTick(keyframe)
	const animation = keyframe.animator.animation
	const siblings = ((keyframe.animator as unknown as Record<string, unknown>)[keyframe.channel] ??
		[]) as _Keyframe[]
	let next: number | undefined
	for (const sibling of siblings) {
		const tick = getKeyframeTick(sibling)
		if (tick > start && (next === undefined || tick < next)) next = tick
	}
	return getRepeatSchedule({
		start,
		repeat: !!keyframe.repeat,
		frequency: Number(keyframe.repeat_frequency),
		duration: Number(keyframe.repeat_duration) || 0,
		next,
		end: Math.floor((animation.length + 1e-9) * TICK_RATE),
		loop: animation.loop === 'loop',
	})
}
