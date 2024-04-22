import { NbtFloat, NbtList } from 'deepslate'

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
