import { NbtFloat, NbtList } from 'deepslate'

export function arrayToNbtFloatArray(array: number[]) {
	return new NbtList(array.map(v => new NbtFloat(v)))
}

export function matrixToNbtFloatArray(matrix: THREE.Matrix4) {
	const matrixArray = new THREE.Matrix4().copy(matrix).transpose().toArray()
	return arrayToNbtFloatArray(matrixArray)
}
