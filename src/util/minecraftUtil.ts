import { MinecraftVersion } from '../systems/global'
import {
	BlockStateRegistryEntry,
	type BlockStateValue,
	getBlockState,
} from '@aj/systems/minecraft-temp/blockstateManager'
import * as pathjs from 'path'

export interface IMinecraftResourceLocation {
	packRoot: string
	namespace: string
	resourcePath: string
	resourceLocation: string
	subtypelessPath: string
	fileName: string
	fileExtension: string
	type: string
}

/**
 * Return a sanitized version of {@param str} that is safe to use as a path name in a data pack or resource pack.
 *
 * Function names can only contain lowercase letters, numbers, underscores, and periods.
 * All other characters are replaced with underscores.
 */
export function sanitizePathName(str: string): string {
	return str.toLowerCase().replace(/[^a-z0-9_.]+/g, '_')
}

/**
 * Return a sanitized version of {@param str} that is safe to use as a storage object key.
 *
 * Storage names can only contain lowercase letters, numbers, and underscores.
 * All other characters are replaced with underscores.
 */
export function sanitizeStorageKey(str: string): string {
	return str.toLowerCase().replace(/[^a-z0-9_]+/g, '_')
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

export function createTagPrefixFromBlueprintID(id: string) {
	const parsed = parseResourceLocation(id)
	if (parsed) {
		const namespace = parsed.namespace === 'animated_java' ? 'aj' : parsed.namespace
		return namespace + '.' + parsed.subpath.replaceAll('/', '.')
	}
}

export function containsInvalidScoreboardTagCharacters(tag: string) {
	if (tag.match(/[^a-zA-Z0-9_\-.]/g)) return true
	return false
}

export function containsInvalidResourceLocationCharacters(resourceLocation: string) {
	if (resourceLocation.match(/[^a-z0-9_/.:]/g)) return true
	return false
}

export function isResourcePackPath(path: string) {
	const parsed = parseResourcePackPath(path)
	return !!(parsed?.namespace && parsed.resourcePath)
}

export function parseResourcePackPath(path: string): IMinecraftResourceLocation | undefined {
	path = path.replaceAll(/\\/g, '/')
	const parts = path.split('/')

	const assetsIndex = parts.indexOf('assets')
	if (assetsIndex === -1) return undefined

	const packRoot = parts.slice(0, assetsIndex).join('/')
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
		packRoot,
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
	const subpath = parts.join('')
	const resourceType = subpath.split('/')[0]
	const parsed = PathModule.parse(subpath)
	return {
		namespace,
		subpath,
		path: PathModule.join(namespace, parsed.name),
		type: resourceType,
		dir: parsed.dir,
		name: parsed.name,
	}
}

export function isDataPackPath(path: string) {
	const parsed = parseDataPackPath(path)
	return !!(parsed?.namespace && parsed.resourcePath)
}

export function parseDataPackPath(path: string): IMinecraftResourceLocation | undefined {
	path = path.replaceAll(/\\/g, '/')
	const parts = path.split('/')

	const assetsIndex = parts.indexOf('data')
	if (assetsIndex === -1) return undefined

	const packRoot = parts.slice(0, assetsIndex).join('/')
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
		packRoot,
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
		const match = /(.+?)\[((?:[^,=[\]]+=[^,=[\]]+,?)+)?]/.exec(block)
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
		resourceLocation: resource.namespace + ':' + resource.subpath,
		states,
		blockStateRegistryEntry: await getBlockState(resource.name),
	}
}

export function sortMCVersions(versions: MinecraftVersion[]): MinecraftVersion[] {
	return versions.sort((a, b) => {
		return compareVersions(a, b) ? -1 : 1
	})
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
		case '1.21.5':
			return 71
		default:
			return Infinity
	}
}

export function getResourcePackFormat(version: MinecraftVersion): number {
	switch (version) {
		case '1.20.4':
			return 22
		case '1.20.5':
			return 32
		case '1.21.0':
			return 34
		case '1.21.2':
			return 42
		case '1.21.4':
			return 46
		case '1.21.5':
			return 55
		default:
			return Infinity
	}
}

export function functionReferenceExists(dataPackRoot: string, resourceLocation: string): boolean {
	const parsed = parseResourceLocation(resourceLocation)
	if (!parsed) return false
	if (parsed.type !== 'tags' && parsed.type !== 'function' && parsed.type !== 'functions')
		return false

	for (const folder of fs.readdirSync(dataPackRoot)) {
		const dataFolder = PathModule.join(dataPackRoot, folder)
		if (!fs.statSync(dataFolder).isDirectory()) continue

		const path = PathModule.join(dataFolder, parsed.path)
		if (!fs.existsSync(path)) continue
		return true
	}

	return false
}

export function getFunctionNamespace(version: string): 'function' | 'functions' {
	// If the target version is 1.21.0 or higher, use the 'function' namespace instead of 'functions'
	return compareVersions(version, '1.20.10000') ? 'function' : 'functions'
}
