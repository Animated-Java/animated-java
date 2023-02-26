export class Subscribable<T> {
	private subscribers: Set<(value: T) => void> = new Set()
	subscribe(callback: (value: T) => void, oneShot: boolean = false) {
		if (oneShot) {
			this.subscribers.add((value: T) => {
				callback(value)
				this.subscribers.delete(callback)
			})
		} else this.subscribers.add(callback)
		return () => this.subscribers.delete(callback)
	}
	dispatch(value: T) {
		this.subscribers.forEach(callback => callback(value))
	}
}
