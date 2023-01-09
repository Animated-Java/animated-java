export class Subscribable<T> {
	private subscribers: Set<(value: T) => void> = new Set()
	subscribe(callback: (value: T) => void) {
		this.subscribers.add(callback)
		return () => this.subscribers.delete(callback)
	}
	dispatchSubscribers(value: T) {
		this.subscribers.forEach(callback => callback(value))
	}
}
