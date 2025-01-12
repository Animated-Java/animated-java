import { NbtCompound, NbtFloat, NbtList } from 'deepslate/lib/nbt'
import {
	AsyncZipOptions,
	AsyncZippable,
	unzip as cbUnzip,
	zip as cbZip,
	type AsyncUnzipOptions,
	type Unzipped,
} from 'fflate/browser'
import { INodeTransform } from './animationRenderer'

export function arrayToNbtFloatArray(array: number[]) {
	return new NbtList(array.map(v => new NbtFloat(v)))
}

export function matrixToNbtFloatArray(matrix: THREE.Matrix4) {
	const matrixArray = new THREE.Matrix4().copy(matrix).transpose().toArray()
	return arrayToNbtFloatArray(matrixArray)
}

export function transformationToNbt(transformation: INodeTransform['decomposed']): NbtCompound {
	const compound = new NbtCompound()
	compound.set('translation', arrayToNbtFloatArray(transformation.translation.toArray()))
	compound.set('left_rotation', arrayToNbtFloatArray(transformation.left_rotation.toArray()))
	compound.set('scale', arrayToNbtFloatArray(transformation.scale.toArray()))
	return compound
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

export function isCubeValid(cube: Cube) {
	// Cube is automatically valid if it has no rotation
	if (cube.rotation[0] === 0 && cube.rotation[1] === 0 && cube.rotation[2] === 0) {
		return true
	}
	const rotation = cube.rotation[0] + cube.rotation[1] + cube.rotation[2]
	// prettier-ignore
	if (
		// Make sure the cube is rotated in only one axis by adding all the rotations together, and checking if the sum is equal to one of the rotations.
		(
			rotation === cube.rotation[0] ||
			rotation === cube.rotation[1] ||
			rotation === cube.rotation[2]
		)
		&&
		// Make sure the cube is rotated in one of the allowed 22.5 degree increments
		(
			rotation === -45   ||
			rotation === -22.5 ||
			rotation === 0     ||
			rotation === 22.5  ||
			rotation === 45
		)
	) {
		return true
	}
	return false
}

export function getFunctionNamespace(version: string): 'function' | 'functions' {
	// If the target version is 1.21.0 or higher, use the 'function' namespace instead of 'functions'
	return compareVersions(version, '1.20.10000') ? 'function' : 'functions'
}
