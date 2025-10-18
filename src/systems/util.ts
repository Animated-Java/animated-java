import { NbtCompound, NbtFloat, NbtList } from 'deepslate/lib/nbt'
import {
	unzip as cbUnzip,
	zip as cbZip,
	type AsyncUnzipOptions,
	type AsyncZipOptions,
	type AsyncZippable,
	type Unzipped,
} from 'fflate/browser'
import { projectTargetVersionIsAtLeast } from 'src/formats/blueprint'
import { roundTo } from '../util/misc'
import type { INodeTransform } from './animationRenderer'

export interface ExportedFile {
	content: string | Buffer
	includeInAJMeta?: boolean
	writeHandler?: (path: string, content: string | Buffer) => Promise<void>
}

export function arrayToNbtFloatArray(array: number[]) {
	return new NbtList(array.map(v => new NbtFloat(v)))
}

export function matrixToNbtFloatArray(matrix: THREE.Matrix4) {
	const matrixArray = new THREE.Matrix4()
		.copy(matrix)
		.transpose()
		.toArray()
		.map(v => roundTo(v, 4))
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

export function isCubeValid(cube: Cube): '1.21.6+' | 'valid' | 'invalid' {
	const totalRotation = cube.rotation[0] + cube.rotation[1] + cube.rotation[2]

	if (totalRotation === 0) return 'valid'

	const isSingleAxisRotation =
		totalRotation === cube.rotation[0] ||
		totalRotation === cube.rotation[1] ||
		totalRotation === cube.rotation[2]

	if (isSingleAxisRotation && projectTargetVersionIsAtLeast('1.21.6')) {
		// Rotation values still need to be within -45 and 45 degrees
		if (totalRotation <= 45 && totalRotation >= -45) return '1.21.6+'
		else return 'invalid'
	}

	const isRotationInAllowedSteps =
		totalRotation === -45 ||
		totalRotation === -22.5 ||
		totalRotation === 0 ||
		totalRotation === 22.5 ||
		totalRotation === 45

	if (isSingleAxisRotation && isRotationInAllowedSteps) return 'valid'

	return 'invalid'
}

export async function sleepForAnimationFrame() {
	return new Promise(resolve => requestAnimationFrame(resolve))
}
