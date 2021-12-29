export * from './util/customAction'
export * from './util/async'
export * from './util/bus'
export * from './util/customError'
export * from './util/errors'
export * from './util/eventSystem'
export * from './util/makeError'
export * from './util/replace'
export * from './util/intl'
export * from './util/store'
export * from './util/hashAnim'
export * from './util/treeGen'
export * from './util/size'
export * from './util/ezfs'
export * from './util/path'
export * from './util/SNBT'

export * as resourcepack from './util/minecraft/resourcepack'
export * from './util/minecraft/jsonText'

export function cloneObject(obj) {
	return JSON.parse(JSON.stringify(obj))
}

export function roundToN(v, n) {
	return Math.round(v * n) / n
}

export function removeKeyGently(key, obj) {
	const ret = {}
	Object.entries(obj).forEach(([k, v]) => {
		if (k !== key) ret[k] = v
	})
	return ret
}

export function removeNamespace(str) {
	const split = str.split(':')

	return split.pop()
}