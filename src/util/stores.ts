import { type Writable, type Subscriber, type Unsubscriber, writable, get } from 'svelte/store'

export class Valuable<T> implements Writable<T> {
	static all: Array<Valuable<any>> = []

	private store: Writable<T>
	private valueValidator: (value: T) => T

	constructor(value: T, valueValidator?: Valuable<T>['valueValidator']) {
		this.store = writable(value)
		this.valueValidator = valueValidator || ((value: T) => value)
		Valuable.all.push(this)
	}

	get() {
		return this.valueValidator(get(this.store))
	}

	set(value: T) {
		return this.store.set(this.valueValidator(value))
	}

	update(fn: (value: T) => T) {
		return this.store.update((value: T) => this.valueValidator(fn(value)))
	}

	subscribe(run: Subscriber<T>, invalidate?: (value?: T) => void): Unsubscriber {
		return this.store.subscribe(run, invalidate)
	}
}

export class SetStore<T> extends Valuable<Set<T>> {
	constructor(value: Set<T>) {
		super(value, (value: Set<T>) => new Set(value))
	}

	add(value: T) {
		const set = this.get()
		set.add(value)
		this.set(set)
	}

	delete(value: T) {
		const set = this.get()
		set.delete(value)
		this.set(set)
	}
}
