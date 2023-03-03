/**
 * A class that can be used to create a subscribable object.
 * @template T The type of the value that is passed to the subscribers.
 */
export class Subscribable<T> {
	protected subscribers = new Set<(value: T) => void>()

	/**
	 * Subscribe to this subscribable.
	 * @param callback The callback to be called when the subscribable is dispatched.
	 * @param oneShot If true, the callback will be removed after it is called once.
	 * @returns A function that can be called to unsubscribe the callback.
	 */
	subscribe(callback: (value: T) => void, oneShot = false) {
		if (oneShot) {
			this.subscribers.add((value: T) => {
				callback(value)
				this.subscribers.delete(callback)
			})
		} else this.subscribers.add(callback)
		return () => this.subscribers.delete(callback)
	}

	/**
	 * Dispatch a value to all subscribers.
	 * @param value The value to be passed to the subscribers.
	 */
	dispatch(value: T) {
		this.subscribers.forEach(callback => callback(value))
	}
}
