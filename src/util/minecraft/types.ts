export type namespacedID = `${string}${string}:${string}${string}`
export type tagSelector =
	| 'x'
	| 'y'
	| 'z'
	| 'distance'
	| 'scores'
	| 'tag'
	| 'team'
	| 'limit'
	| 'sort'
	| 'level'
	| 'gamemode'
	| 'x_rotation'
	| 'y_rotation'
	| 'type'
	| 'nbt'
	| 'advancements'
	| 'predicate'
export type selectorString = `@${'s' | 'e' | 'p' | 'a' | 'r'}${
	| ''
	| `[${tagSelector}=${string}]`}`
// const test2:selectorString = "@a[x=3,distance=2]";
export type command = string
export type position = {
	x: number
	y: number
	z: number
}
