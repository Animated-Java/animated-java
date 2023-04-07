export function objectEqual(a: any, b: any) {
	/*Make sure the object is of the same type as this*/
	if (typeof b !== typeof a) return false

	/*Iterate through the properties of this object looking for a discrepancy between this and obj*/
	for (const property in a) {
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

export function roundTo(n: number, d: number) {
	return Math.round(n * 10 ** d) / 10 ** d
}

export function roundToN(n: number, x: number) {
	return Math.round(n * x) / x
}

/**
 * Returns a promise that resolves when the given resolver function returns a non-null value
 * @param resolver A function that returns a value or null
 * @param interval The interval in milliseconds to check the resolver function
 */
export function pollPromise<T = any>(resolver: () => T | undefined | null, interval?: 250) {
	return new Promise<T>(resolve => {
		const id = setInterval(() => {
			const result = resolver()
			if (result === null || result === undefined) return
			clearInterval(id)
			resolve(result)
		}, interval)
	})
}

export const uuidRegex =
	/^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/

/**
 * An class that lets you limit how much time something can take per frame.
 */
export class LimitClock {
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
			return true
		}
		return false
	}
}

/**
 * Resolves a string with %ENVIORNMENT% variables
 */
export function resolveEnv(path: string) {
	return path.replace(/%([^%]+?)%/g, (match: string, key: string) => {
		const variable = process.env[key]
		if (variable === undefined) {
			console.error(`Unknown enviornment variable found in path: '${key}' -> ${path}`)
			return match
		}
		return variable
	})
}

export function debounce(func: (...args: unknown[]) => void, debounceTime = 500) {
	let timeout: NodeJS.Timeout
	return function (...args: unknown[]): void {
		clearTimeout(timeout)
		timeout = setTimeout(() => func(...args), debounceTime)
	}
}

export type FormattingObject = Record<string, string> | string[]
export function formatStr(str: string, formatObj: FormattingObject = {}) {
	if (Array.isArray(formatObj)) {
		for (let i = 0; i < formatObj.length; i++) {
			str = str.replace(new RegExp(`%s`), formatObj[i])
			str = str.replace(new RegExp(`%${i}`, 'g'), formatObj[i])
		}
		return str
	} else {
		// Sort the keys by size. This makes sure %a and %abc aren't confused.
		const keys = Object.keys(formatObj).sort((a, b) => b.length - a.length)
		for (const target of keys)
			str = str.replace(new RegExp('%' + target, 'g'), formatObj[target])
		return str
	}
}

export function transposeMatrix(matrixArray: number[]) {
	// prettier-ignore
	return [
		matrixArray[0], matrixArray[4], matrixArray[8], matrixArray[12],
		matrixArray[1], matrixArray[5], matrixArray[9], matrixArray[13],
		matrixArray[2], matrixArray[6], matrixArray[10], matrixArray[14],
		matrixArray[3], matrixArray[7], matrixArray[11], matrixArray[15],
	]
}

export function arrayEqual(a: any[], b: any[]): boolean {
	console.log(a, b)
	if (a.length !== b.length) return false
	return a.every((v, i) => {
		const bi = b[i]
		if (Array.isArray(v) && Array.isArray(bi)) return arrayEqual(v, bi)
		return v === bi
	})
}

export class ExpectedError extends Error {}
