export interface Subscribable<T> {
	subscribe: (callback: (value: T) => void, oneShot?: boolean) => () => void
	publish: (value: T) => void
}

/**
 * Creates a simple subscribable object.
 * @template T The type of the value that is passed to the subscribers.
 */
export function subscribable<T>(): Subscribable<T> {
	const subscribers = new Set<(value: T) => void>()
	// Used to prevent recursive publishing
	let publishing = false
	return {
		/**
		 * Subscribe to this subscribable.
		 * @param callback The callback to be called when the subscribable is published.
		 * @param oneShot If true, the callback will be removed after it is called once.
		 * @returns A function that can be called to unsubscribe the callback.
		 */
		subscribe: (callback: (value: T) => void, oneShot = false) => {
			if (oneShot) {
				const wrappedCallback = (value: T) => {
					callback(value)
					subscribers.delete(wrappedCallback)
				}
				subscribers.add(wrappedCallback)
			} else subscribers.add(callback)
			return () => subscribers.delete(callback)
		},
		/**
		 * Publish a value to all subscribers.
		 * @param value The value to be passed to the subscribers.
		 */
		publish: (value: T) => {
			if (publishing) return
			publishing = true
			subscribers.forEach(callback => callback(value))
			publishing = false
		},
	}
}
