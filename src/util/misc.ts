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
		}
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

export function columnToRowMajor(matrixArray: number[]) {
	const m11 = matrixArray[0],
		m12 = matrixArray[4],
		m13 = matrixArray[8],
		m14 = matrixArray[12]
	const m21 = matrixArray[1],
		m22 = matrixArray[5],
		m23 = matrixArray[9],
		m24 = matrixArray[13]
	const m31 = matrixArray[2],
		m32 = matrixArray[6],
		m33 = matrixArray[10],
		m34 = matrixArray[14]
	const m41 = matrixArray[3],
		m42 = matrixArray[7],
		m43 = matrixArray[11],
		m44 = matrixArray[15]

	return [m11, m12, m13, m14, m21, m22, m23, m24, m31, m32, m33, m34, m41, m42, m43, m44]
}
