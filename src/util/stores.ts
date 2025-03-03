import { get, type Subscriber, type Unsubscriber, type Writable, writable } from 'svelte/store'
import { mapObjEntries } from './misc'

/**
 * Syncables are stores that have both a getter and a setter.
 *
 * They are useful when you want to have a store that needs to be accessed and modified from multiple places.
 */
export class Syncable<T> implements Writable<T> {
	static all: Array<Syncable<any>> = []

	private store: Writable<T>
	private validator: (value: T) => T
	/**
	 * @param value The initial value of the store.
	 * @param validator A function that validates the value before it is set.
	 */
	constructor(value: T, validator?: Syncable<T>['validator']) {
		this.store = writable(value)
		this.validator = validator ?? (v => v)
		Syncable.all.push(this)
	}

	get() {
		return this.validator(get(this.store))
	}

	set(value: T) {
		return this.store.set(this.validator(value))
	}

	/**
	 * Dispatches the current value to all subscribers.
	 *
	 * This is useful when the value is an object or array and you want to notify all subscribers that the value has changed.
	 */
	dispatch() {
		this.store.set(this.get())
	}

	update(fn: (value: T) => T) {
		return this.store.update(v => this.validator(fn(v)))
	}

	subscribe(run: Subscriber<T>, invalidate?: (value?: T) => void): Unsubscriber {
		return this.store.subscribe(run, invalidate)
	}
}

export class SetStore<T> extends Syncable<Set<T>> {
	constructor(value: Set<T>) {
		super(value, (value: Set<T>) => new Set(value))
	}

	add(value: T) {
		const set = this.get()
		set.add(value)
		this.dispatch()
	}

	delete(value: T) {
		const set = this.get()
		set.delete(value)
		this.dispatch()
	}
}

export class MapStore<K, V> extends Syncable<Map<K, V>> {
	constructor(value: Map<K, V>) {
		super(value, (value: Map<K, V>) => new Map(value))
	}

	setKey(key: K, value: V) {
		const map = this.get()
		map.set(key, value)
		this.dispatch()
	}

	delete(key: K) {
		const map = this.get()
		map.delete(key)
		this.dispatch()
	}
}

export function makeSyncable<O extends Record<string, any>>(obj: O) {
	return mapObjEntries(obj, (k, v) => [k, new Syncable(v)]) as {
		[Key in keyof O]: Syncable<O[Key]>
	}
}

export function makeNotSyncable<O extends Record<string, Syncable<any>>>(obj: O) {
	return mapObjEntries(obj, (k, v) => [k, v.get()]) as {
		[Key in keyof O]: ReturnType<O[Key]['get']>
	}
}
