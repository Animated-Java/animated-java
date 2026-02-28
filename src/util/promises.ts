/**
 * Polls a function until it returns a non-null/undefined value, then resolves the promise with that value.
 */
export function awaitResult<T>(fn: () => T | undefined | null, interval = 100): Promise<T> {
	return new Promise(resolve => {
		const handle = setInterval(() => {
			const result = fn()
			if (result !== undefined && result !== null) {
				clearInterval(handle)
				resolve(result)
			}
		}, interval)
	})
}
