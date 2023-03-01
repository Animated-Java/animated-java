export function objectEqual(a: any, b: any) {
	/*Make sure the object is of the same type as this*/
	if (typeof b !== typeof a) return false

	/*Iterate through the properties of this object looking for a discrepancy between this and obj*/
	for (var property in a) {
		/*Return false if obj doesn't have the property or if its value doesn't match this' value*/
		if (typeof b[property] == 'undefined') return false
		if (b[property] != a[property]) return false
		if (typeof b[property] == 'object') {
			/*If the property is an object, recursively check it*/
			if (!b[property].equals(a[property])) return false
		}
	}

	/*Object's properties are equivalent */
	return true
}

export function defer(fn: Function) {
	setTimeout(fn, 0)
}

export function roundTo(n: number, d: number) {
	return Math.round(n * 10 ** d) / 10 ** d
}

export function roundToN(n: number, x: number) {
	return Math.round(n * x) / x
}

export function awaitResolve<T = any>(
	resolver: () => T | undefined | null,
	interval: number = 250
) {
	return new Promise<T>(resolve => {
		const id = setInterval(() => {
			const result = resolver()
			if (!result) return
			clearInterval(id)
			resolve(result)
		}, interval)
	})
}

export const uuidRegex =
	/^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/

export class LimitedClock {
	lastTime: number
	constructor(public limit: number) {
		this.lastTime = performance.now()
	}

	async sync() {
		const now = performance.now()
		const diff = now - this.lastTime
		if (diff >= this.limit) {
			await new Promise(r => requestAnimationFrame(r))
			this.lastTime = performance.now()
		}
	}
}
