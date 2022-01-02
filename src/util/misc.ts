export function roundToN(v: number, n: number) {
	return Math.round(v * n) / n
}

export function cloneObject(obj: any): any {
	return JSON.parse(JSON.stringify(obj))
}

export function removeKeyGently(key: string, obj: any) {
	const ret = {}
	Object.entries(obj).forEach(([k, v]) => {
		if (k !== key) ret[k] = v
	})
	return ret
}

export function removeNamespace(str: string) {
	const split = str.split(':')
	return split.pop()
}

export function size(item: any) {
	if (item instanceof Set || item instanceof Map) return item.size
	if (Array.isArray(item) || typeof item === 'string') return item.length
	if (typeof item === 'object') return Object.keys(item).length
	console.warn('unable to get size of item:', item)
	throw new Error(
		'unable to get size of item, please check your dev tools or see the log above this error for more info'
	)
}

export function wrapNumber(num: number, min: number, max: number): number {
	return ((((num - min) % (max - min)) + (max - min)) % (max - min)) + min
}
