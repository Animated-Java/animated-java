import { NbtCompound, NbtFloat, NbtList } from 'deepslate/lib/nbt'
import {
	unzipSync,
	zipSync,
	type Unzipped,
	type UnzipOptions,
	type ZipOptions,
	type Zippable,
} from 'fflate/browser'
import { projectTargetVersionIsAtLeast } from '../formats/blueprint'
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

export function matrixToNbtFloatArray(matrix: number[] | THREE.Matrix4) {
	const elements = matrix instanceof THREE.Matrix4 ? matrix.elements : matrix
	const matrixArray = new THREE.Matrix4()
		.fromArray(elements)
		.transpose()
		.toArray()
		.map(v => roundTo(v, 4))
	return arrayToNbtFloatArray(matrixArray)
}

export function transformationToNbt(
	transformation: NonNullable<INodeTransform['decomposed']>
): NbtCompound {
	const compound = new NbtCompound()
	compound.set('translation', arrayToNbtFloatArray(transformation.translation))
	compound.set('left_rotation', arrayToNbtFloatArray(transformation.left_rotation))
	compound.set('scale', arrayToNbtFloatArray(transformation.scale))
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

/**
 * Zips on the main thread. fflate's async `zip` compresses files over 160KB in a worker, which
 * breaks under esbuild's `keepNames` the same way as {@link unzip}.
 */
export const zip = (data: Zippable, options: ZipOptions) => {
	return new Promise<Uint8Array>(resolve => resolve(zipSync(data, options)))
}

/**
 * Unzips on the main thread. fflate's async `unzip` already inflates entries under 512KB there, and
 * hands bigger ones (like 26.3's `en_us.json`) to a worker built from its own function source,
 * which breaks under esbuild's `keepNames`: the injected `__name` helper doesn't exist in the
 * worker.
 */
export const unzip = (data: Uint8Array, options: UnzipOptions) => {
	// The executor turns a throw from unzipSync into a rejection, like the async version.
	return new Promise<Unzipped>(resolve => resolve(unzipSync(data, options)))
}

export function isCubeValid(cube: Cube): '1.21.6+' | 'valid' | 'invalid' {
	// Rotations are unrestricted on 1.21.11+
	if (projectTargetVersionIsAtLeast('1.21.11')) return 'valid'

	const nonZeroRotations = cube.rotation.filter(v => v !== 0)
	if (nonZeroRotations.length === 0) return 'valid'
	// Multiple axes of rotation are not allowed on versions before 1.21.11
	if (nonZeroRotations.length > 1) return 'invalid'

	const rotation = nonZeroRotations[0]

	if (projectTargetVersionIsAtLeast('1.21.6')) {
		// Rotation values still need to be within -45 and 45 degrees
		return rotation <= 45 && rotation >= -45 ? '1.21.6+' : 'invalid'
	}

	const isRotationInAllowedSteps =
		rotation === -45 ||
		rotation === -22.5 ||
		rotation === 0 ||
		rotation === 22.5 ||
		rotation === 45

	return isRotationInAllowedSteps ? 'valid' : 'invalid'
}

export async function sleepForAnimationFrame() {
	return new Promise(resolve => requestAnimationFrame(resolve))
}
