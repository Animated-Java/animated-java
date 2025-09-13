import { get, writable, type Writable } from 'svelte/store'

type SyncableTypes = string | number | boolean | undefined

export type Syncable<T extends SyncableTypes> = Writable<T> & {
	get(): T
}

/**
 * Create a {@link writable} store that also has a get() method to retrieve the current value.
 * @param value The initial value of the store
 */
export function syncable<T extends SyncableTypes>(value: T): Syncable<T> {
	return {
		...writable(value),
		get() {
			return get(this)
		},
	}
}

/**
 * Converts all values in an object to {@link Syncable} stores.
 */
export function makeValuesSyncable<T extends Record<string, SyncableTypes>>(obj: T) {
	const result: Record<string, any> = {}
	for (const key in obj) {
		result[key] = syncable(obj[key])
	}
	return result as { [K in keyof T]: Syncable<T[K]> }
}

/**
 * Resolves all {@link Syncable} values in an object to their current values.
 */
export function resolveSyncableValues<T extends Record<string, any>>(obj: {
	[K in keyof T]: Syncable<T[K]>
}): { [K in keyof T]: T[K] } {
	const result: Record<string, any> = {}
	for (const key in obj) {
		result[key] = obj[key].get()
	}
	return result as { [K in keyof T]: T[K] }
}
