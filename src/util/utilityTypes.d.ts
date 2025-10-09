export interface Tuple<T, L extends number> extends Array<T> {
	0: T
	length: L
}

/** Gets all keys of an object union */
export type AllKeys<T> = T extends any ? keyof T : never
/** Gets keys that are common between all members of a object union */
export type CommonKeys<T extends object> = Extract<AllKeys<T>, keyof T>
/** Gets keys that aren't common between all members of a object union */
export type UncommonKeys<T extends object> = Exclude<AllKeys<T>, CommonKeys<T>>
/** Gets the type of a key in an object, or undefined if the key doesn't exist in the object */
export type PickType<T, K extends AllKeys<T>> = T extends { [k in K]?: any } ? T[K] : undefined
/** Gets the type of a key in an object union, or never if the key doesn't exist in any member of the union */
export type PickTypeOf<T, K extends string | number | symbol> = K extends AllKeys<T>
	? PickType<T, K>
	: never
/**
 * Merges an object union into a single object, where keys that are common between all members are required, and keys that aren't common are optional.
 */
export type MergeUnion<T extends object> = {
	[k in CommonKeys<T>]: PickTypeOf<T, k>
} & {
	[k in UncommonKeys<T>]?: PickTypeOf<T, k>
}
