export class PollingCancelledError extends Error {
	constructor() {
		super('Polling was cancelled')
		this.name = 'PollingCancelledError'
	}
}

/**
 * Polls a function every frame until it returns a non-nullish value, or until a cancel condition is met or a timeout occurs.
 */
export function pollUntilResult<T>(
	/**
	 * The function to poll. Should return a non-nullish value to resolve the promise.
	 */
	callback: () => T | undefined | null,
	/**
	 * If this condition returns true, polling will be cancelled.
	 */
	cancelCondition: () => boolean,
	/**
	 * Maximum time to wait before timing out, in milliseconds. Defaults to 1 minute.
	 */
	timeout = 1000 * 60,
	/**
	 * Time between polls in milliseconds. Defaults to polling every animation frame.
	 */
	interval?: number
): Promise<T> {
	const startTime = performance.now()

	const timeoutCallback =
		interval !== undefined
			? (cb: FrameRequestCallback) => setTimeout(cb, interval)
			: requestAnimationFrame

	return new Promise<T>((resolve, reject) => {
		const poll = () => {
			if (cancelCondition()) return reject(new PollingCancelledError())
			const result = callback()
			if (result != undefined) return resolve(result)
			if (performance.now() - startTime > timeout)
				return reject(new Error('Polling timed out'))
			timeoutCallback(poll)
		}
		// poll() // Check immediately in case the condition is already met
		timeoutCallback(poll)
	})
}
