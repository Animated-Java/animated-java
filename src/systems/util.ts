import { NbtFloat, NbtList } from 'deepslate/lib/nbt'
import {
	AsyncZipOptions,
	AsyncZippable,
	unzip as cbUnzip,
	zip as cbZip,
	type AsyncUnzipOptions,
	type Unzipped,
} from 'fflate/browser'

export function arrayToNbtFloatArray(array: number[]) {
	return new NbtList(array.map(v => new NbtFloat(v)))
}

export function matrixToNbtFloatArray(matrix: THREE.Matrix4) {
	const matrixArray = new THREE.Matrix4().copy(matrix).transpose().toArray()
	return arrayToNbtFloatArray(matrixArray)
}

export function replacePathPart(path: string, oldPart: string, newPart: string) {
	return path
		.split(PathModule.sep)
		.map(v => (v === oldPart ? newPart : v))
		.join(PathModule.sep)
}

/**
 * Returns a new object with the keys sorted alphabetically
 */
export function sortObjectKeys<T extends Record<string, any>>(obj: T): T {
	const sorted: Record<string, any> = {}
	Object.keys(obj)
		.sort()
		.forEach(key => {
			sorted[key] = obj[key]
		})
	return sorted as T
}

export function debounce(func: () => void, timeout = 300) {
	let timer: NodeJS.Timeout
	return () => {
		clearTimeout(timer)
		timer = setTimeout(func, timeout)
	}
}

// promisify didn't work 😔
export const zip = (data: AsyncZippable, options: AsyncZipOptions) => {
	return new Promise<Uint8Array>((resolve, reject) => {
		cbZip(data, options, (err, result) => {
			if (err) {
				reject(err)
			} else {
				resolve(result)
			}
		})
	})
}

// promisify didn't work 😔
export const unzip = (data: Uint8Array, options: AsyncUnzipOptions) => {
	return new Promise<Unzipped>((resolve, reject) => {
		cbUnzip(data, options, (err, result) => {
			if (err) {
				reject(err)
			} else {
				resolve(result)
			}
		})
	})
}
