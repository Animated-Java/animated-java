import * as pathjs from 'path'
import {
	BlockStateRegistryEntry,
	BlockStateValue,
	getBlockState,
} from '../systems/minecraft/blockstateManager'
import { MinecraftVersion } from '../systems/datapackCompiler/mcbFiles'

export interface IMinecraftResourceLocation {
	resourcePackRoot: string
	namespace: string
	resourcePath: string
	resourceLocation: string
	subtypelessPath: string
	fileName: string
	fileExtension: string
	type: string
}

export function toSafeFuntionName(name: string): string {
	return name
		.toLowerCase()
		.replace(/[^a-z0-9_\\.]/g, '_')
		.replace(/_+/g, '_')
}

/**
 * Get the path of a resource location, e.g. 'minecraft:block/stone' -> 'assets/minecraft/models/block/stone'
 * @param resourceLocation The resource location, e.g. 'minecraft:block/stone'
 * @param type The type of the resource, e.g. 'models', 'textures', 'sounds'
 * @returns The path of the resource, e.g. 'assets/minecraft/models/block/stone'
 */
export function getPathFromResourceLocation(resourceLocation: string, type: string): string {
	let [namespace, ...path] = resourceLocation.split(':')
	if (!namespace) {
		throw new Error(`Invalid resource location: '${resourceLocation}'`)
	}
	if (path.length === 0) {
		path = [namespace]
		namespace = 'minecraft'
	}
	return `assets/${namespace}/${type}/${path.join('/')}`
}

export function isResourcePackPath(path: string) {
	const parsed = parseResourcePackPath(path)
	return !!(parsed && parsed.namespace && parsed.resourcePath)
}

export function parseResourcePackPath(path: string): IMinecraftResourceLocation | undefined {
	path = path.replaceAll(/\\/g, '/')
	const parts = path.split('/')

	const assetsIndex = parts.indexOf('assets')
	if (assetsIndex === -1) return undefined

	const resourcePackRoot = parts.slice(0, assetsIndex).join('/')
	const namespace = parts[assetsIndex + 1]
	const type = parts[assetsIndex + 2]
	const resourcePath = parts.slice(assetsIndex + 3, -1).join('/')
	const fileName = pathjs.basename(path).split('.').slice(0, -1).join('.')
	if (fileName !== fileName.toLowerCase()) return undefined
	const resourceLocation = (namespace + ':' + PathModule.join(resourcePath, fileName)).replaceAll(
		/\\/g,
		'/'
	)
	const subtypelessPath = parts.slice(assetsIndex + 4).join('/')

	return {
		resourcePackRoot,
		namespace,
		resourcePath,
		resourceLocation,
		subtypelessPath,
		fileName,
		fileExtension: pathjs.extname(path),
		type,
	}
}

export function parseResourceLocation(resourceLocation: string) {
	let [namespace, ...parts] = resourceLocation.split(':')
	if (parts.length === 0) {
		parts = [namespace]
		namespace = 'minecraft'
	}
	const path = parts.join('')
	const resourceType = path.split('/')[0]
	const parsed = PathModule.parse(path)
	return {
		namespace,
		path,
		type: resourceType,
		dir: parsed.dir,
		name: parsed.name,
	}
}

export function isDataPackPath(path: string) {
	const parsed = parseDataPackPath(path)
	return !!(parsed && parsed.namespace && parsed.resourcePath)
}

export function parseDataPackPath(path: string): IMinecraftResourceLocation | undefined {
	path = path.replaceAll(/\\/g, '/')
	const parts = path.split('/')

	const assetsIndex = parts.indexOf('data')
	if (assetsIndex === -1) return undefined

	const resourcePackRoot = parts.slice(0, assetsIndex).join('/')
	const namespace = parts[assetsIndex + 1]
	const type = parts[assetsIndex + 2]
	let resourcePath: string
	switch (type) {
		case 'tags':
			resourcePath = parts.slice(assetsIndex + 4, -1).join('/')
			break
		default:
			resourcePath = parts.slice(assetsIndex + 3, -1).join('/')
			break
	}
	const fileName = pathjs.basename(path).split('.').slice(0, -1).join('.')
	if (fileName !== fileName.toLowerCase()) return undefined
	const resourceLocation = (namespace + ':' + PathModule.join(resourcePath, fileName)).replaceAll(
		/\\/g,
		'/'
	)
	const subtypelessPath = parts.slice(assetsIndex + 4).join('/')

	return {
		resourcePackRoot,
		namespace,
		resourcePath,
		resourceLocation,
		subtypelessPath,
		fileName,
		fileExtension: pathjs.extname(path),
		type,
	}
}

export interface IFunctionTag {
	replace?: boolean
	values: Array<string | { id: string; required?: boolean }>
}

export function mergeTag(oldTag: IFunctionTag, newTag: IFunctionTag): IFunctionTag {
	oldTag.values.forEach(value => {
		if (typeof value === 'string') {
			if (!newTag.values.some(v => (typeof v === 'object' ? v.id === value : v === value))) {
				newTag.values.push(value)
			}
		} else {
			if (
				!newTag.values.some(v =>
					typeof v === 'object' ? v.id === value.id : v === value.id
				)
			) {
				newTag.values.push(value)
			}
		}
	})
	return newTag
}

export function resolveBlockstateValueType(
	value: string,
	allowArray: true
): string | number | boolean | Array<string | number | boolean>
export function resolveBlockstateValueType(
	value: string,
	allowArray: false
): string | number | boolean
export function resolveBlockstateValueType(value: string, allowArray: boolean) {
	if (value === 'true') return true
	if (value === 'false') return false
	if (!isNaN(Number(value))) return Number(value)
	if (allowArray && value.includes('|')) {
		return value.split('|').map(v => {
			if (v === 'true') return true
			if (v === 'false') return false
			if (!isNaN(Number(v))) return Number(v)
			return v
		})
	}
	return value
}

export interface IParsedBlock {
	resource: ReturnType<typeof parseResourceLocation>
	resourceLocation: string
	states: Record<string, BlockStateValue>
	blockStateRegistryEntry: BlockStateRegistryEntry | undefined
}

export async function parseBlock(block: string): Promise<IParsedBlock | undefined> {
	const states: Record<string, ReturnType<typeof resolveBlockstateValueType>> = {}
	if (block.includes('[')) {
		const match = block.match(/(.+?)\[((?:[^,=[\]]+=[^,=[\]]+,?)+)?]/)
		if (!match) return
		if (match[2] !== undefined) {
			const args = match[2].split(',')
			for (const arg of args) {
				const [key, value] = arg.trim().split('=')
				states[key] = resolveBlockstateValueType(value, false)
			}
		}
		block = match[1]
	}

	const resource = parseResourceLocation(block)
	return {
		resource,
		resourceLocation: resource.namespace + ':' + resource.path,
		states,
		blockStateRegistryEntry: await getBlockState(resource.name),
	}
}

export function getDataPackFormat(version: MinecraftVersion): number {
	switch (version) {
		case '1.20.4':
			return 26
		case '1.20.5':
			return 41
		case '1.21.0':
			return 48
		case '1.21.2':
			return 57
		case '1.21.4':
			return 61
		default:
			return Infinity
	}
}
