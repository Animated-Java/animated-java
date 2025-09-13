/**
 * Returns a copy of {@link obj} with the specified {@link keys} removed.
 */
export function omitKeys<R extends Record<string, any>, K extends keyof R>(
	obj: R,
	keys: K[]
): Omit<R, K> {
	for (const key of keys) {
		delete obj[key]
	}
	return obj as Omit<R, K>
}

/**
 * Returns a copy of {@link obj} with only the specified {@link keys}.
 */
export function pickKeys<R extends Record<string, any>, K extends keyof R>(
	obj: R,
	keys: K[]
): Pick<R, K> {
	const result: Partial<R> = {}
	for (const key of keys) {
		if (key in obj) {
			result[key] = obj[key]
		}
	}
	return result as Pick<R, K>
}

/**
 * Recursively removes all `undefined` values from the given object.
 */
export function scrubUndefined<T extends Record<string, any>>(obj: T, recursive = false): T {
	for (const key in obj) {
		if (obj[key] === undefined) {
			delete obj[key]
		} else if (recursive && typeof obj[key] === 'object') {
			obj[key]?.scrubUndefined(recursive)
		}
	}
	return obj
}

/**
 * Calls a defined callback function on each key value pair of an object, and returns a new object that contains the results.
 */
export function mapEntries<V, RV>(
	obj: Record<string, V>,
	cb: (k: string, v: V) => [string, RV]
): Record<string, RV> {
	return Object.fromEntries(Object.entries(obj).map(([k, v]) => cb(k, v)))
}

/**
 * Returns a copy of this object with it's keys sorted alphabetically
 */
export function sortKeys<T extends Record<string, any>>(
	obj: T,
	compareFn?: (a: string, b: string) => number
): T {
	const sorted: Record<string, any> = {}
	Object.keys(obj)
		.sort(compareFn)
		.forEach(key => {
			sorted[key] = obj[key]
		})
	return sorted as T
}

// If a key exists in both Target and O, and the value type of Target is different from O, require a mapping function for that key
// If a key exists only in Target, require a constant value for that key
// If a key exists only in Source, ignore it
type MutationMap<Target, Source> = {
	[K in keyof Source]?: K extends keyof Target
		? Target[K] extends never
			? never
			: Target[K] extends Source[K]
				? Target[K]
				: (v: Source[K]) => Target[K]
		: never
} & {
	[K in Exclude<keyof Target, keyof Source>]: Target[K]
}

/**
 * Mutates {@link obj} into the shape of {@link Target} by applying the functions in {@link map} to the corresponding keys.
 */
export function mutateInto<Target extends Record<string, any>, Source extends Record<string, any>>(
	obj: Source,
	map: MutationMap<Target, Source>
): Target {
	const result: Record<string, any> = {}
	for (const key in obj) {
		if (key in map) {
			const value = map[key]
			if (typeof value === 'function') {
				result[key] = value ? value(obj[key]) : obj[key]
			} else {
				result[key] = value
			}
		}
	}
	return result as Target
}
