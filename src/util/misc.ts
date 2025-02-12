import { BLUEPRINT_FORMAT } from '../blockbench-additions/model-formats/ajblueprint'

import { type ComponentConstructorOptions } from 'svelte'

export type SvelteComponentConstructor<T, U extends ComponentConstructorOptions> = new (
	options: U
) => T

export function addProjectToRecentProjects(file: FileResult) {
	if (!Project || !file.path) return
	const name = pathToName(file.path, true)
	if (file.path && isApp && !file.no_file) {
		const project = Project
		Project.save_path = file.path
		Project.name = pathToName(name, false)
		addRecentProject({
			name,
			path: file.path,
			icon: BLUEPRINT_FORMAT.icon,
		})
		setTimeout(() => {
			if (Project === project) void updateRecentProjectThumbnail()
		}, 200)
	}
}

/**
 * Rounds a number to a certain number of decimal places
 */
export function roundTo(n: number, d: number) {
	return Math.round(n * 10 ** d) / 10 ** d
}

/**
 * Rounds a number to the nearest multiple of n
 */
export function roundToNth(n: number, x: number) {
	return Math.round(n * x) / x
}

export function floatToHex(n: number) {
	return Number((255 * n).toFixed(0))
		.toString(16)
		.padStart(2, '0')
}

export function tinycolorToDecimal(color: InstanceType<typeof tinycolor>) {
	const rgba = color.toRgb()
	return ((rgba.a * 255) << 24) | (rgba.r << 16) | (rgba.g << 8) | rgba.b
}

export function makeNotZero(vec: THREE.Vector3 | THREE.Euler) {
	if (vec.x === 0) vec.x = 0.00001
	if (vec.y === 0) vec.y = 0.00001
	if (vec.z === 0) vec.z = 0.00001
}

export function scrubUndefined<T extends Record<string, any>>(obj: T) {
	for (const key in obj) {
		if (obj[key] === undefined) {
			delete obj[key]
		} else if (typeof obj[key] === 'object') {
			scrubUndefined(obj[key])
		}
	}
	return obj
}

// Developed by FetchBot 💖
interface LLNode {
	parent?: LLNode
	name: string
}
export function detectCircularReferences(obj: any): boolean {
	const nodes = new Map<any, LLNode>()
	function itter(obj: any, parent: LLNode) {
		if (typeof obj !== 'object' || obj === null) return
		if (nodes.has(obj)) {
			const node = nodes.get(obj)
			const stringifyNode = (node?: LLNode): string => {
				return node
					? `${node.parent ? `${stringifyNode(node.parent)}.` : ''}${node.name}`
					: ''
			}
			throw `Circular reference detected:\n\tValue at '${stringifyNode(
				parent
			)}'\n\tis also at '${stringifyNode(node)}'`
		}
		nodes.set(obj, parent)
		for (const key in obj) {
			itter(obj[key], {
				parent,
				name: key,
			})
		}
		nodes.delete(obj)
	}
	try {
		itter(obj, { name: 'root' })
		return false
	} catch (error) {
		if (typeof error !== 'string') throw error
		console.warn(error)
		return true
	}
}

export function eulerFromQuaternion(q: THREE.Quaternion) {
	const euler = new THREE.Euler().setFromQuaternion(q, 'YXZ')
	const rot = new THREE.Vector3(euler.x, euler.y, euler.z).multiplyScalar(180 / Math.PI)
	rot.x *= -1
	rot.y = rot.y * -1 + 180
	return rot
}

export function mapObjEntries<V, RV>(
	obj: Record<string, V>,
	cb: (k: string, v: V) => [string, RV]
): Record<string, RV> {
	return Object.fromEntries(Object.entries(obj).map(([k, v]) => cb(k, v)))
}

export function markdownToHTML(markdown: string) {
	return markdown
		.replaceAll('\n', '<br/>')
		.replaceAll(/`(.+?)`/g, '<code class="animated-java-code">$1</code>')
		.replaceAll(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
		.replaceAll(/\*(.+?)\*/g, '<em>$1</em>')
		.replaceAll(/~~(.+?)~~/g, '<del>$1</del>')
		.replaceAll(/\[([^\]]+?)\]\(([^)]+?)\)/g, '<a href="$2">$1</a>')
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
