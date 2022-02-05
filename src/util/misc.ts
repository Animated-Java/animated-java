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

export function normalizePath(path: string, stripTrailing?: boolean) {
	if (path === '\\' || path === '/') return '/'

	var len = path.length
	if (len <= 1) return path

	// ensure that win32 namespaces has two leading slashes, so that the path is
	// handled properly by the win32 version of path.parse() after being normalized
	// https://msdn.microsoft.com/library/windows/desktop/aa365247(v=vs.85).aspx#namespaces
	var prefix = ''
	if (len > 4 && path[3] === '\\') {
		var ch = path[2]
		if ((ch === '?' || ch === '.') && path.slice(0, 2) === '\\\\') {
			path = path.slice(2)
			prefix = '//'
		}
	}

	var segs = path.split(/[/\\]+/)
	if (stripTrailing !== false && segs[segs.length - 1] === '') {
		segs.pop()
	}
	return prefix + segs.join('/')
}

export function promiseWhen(condition: any, timeout: number) {
	return new Promise<void>((resolve, reject) =>
		(function wait() {
			if (condition()) resolve()
			setTimeout(wait, timeout)
		})()
	)
}

interface SimpleVector3 {
	x: number
	y: number
	z: number
}

export function isEqualVector(a: SimpleVector3, b: SimpleVector3) {
	return a.x == b.x && a.y == b.y && a.z == b.z
}
