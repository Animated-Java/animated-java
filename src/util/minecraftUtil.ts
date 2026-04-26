import * as pathjs from 'node:path'
import { getFsModule } from '../constants'
import { validateBlockState } from '../systems/minecraft/blockModelManager'
import {
	BlockStateRegistryEntry,
	type BlockStateValue,
	getBlockState,
} from '../systems/minecraft/blockstateManager'
import { getRegistryEntry } from '../systems/minecraft/registryManager'

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

const CHARACTERS = 'abcdefghijklmnopqrstuvwxyz0123456789'
const SMALL_CAPS_CHARACTERS = 'ᴀʙᴄᴅᴇꜰɢʜɪᴊᴋʟᴍɴᴏᴘꞯʀꜱᴛᴜᴠᴡxʏᴢ⁰¹²³⁴⁵⁶⁷⁸⁹'

export function toSmallCaps(str: string): string {
	let result = ''
	for (const char of str) {
		const index = CHARACTERS.indexOf(char.toLowerCase())
		if (index !== -1) {
			result += SMALL_CAPS_CHARACTERS[index]
		} else {
			result += char
		}
	}
	return result
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
	const path = parts.join('')
	const resourceType = path.split('/')[0]
	const parsed = PathModule.parse(path)
	const fullPath = PathModule.join(namespace, path)
	return {
		namespace,
		path,
		fullPath,
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

export interface FunctionTagJSON {
	replace?: boolean
	values: Array<string | { id: string; required?: boolean }>
}

type TagEntry = string | { id: string; required?: boolean }

export class DataPackTag {
	replace = false
	values: Array<string | { id: string; required?: boolean }> = []

	has(entry: TagEntry) {
		const id = DataPackTag.getEntryId(entry)
		return this.values.some(v => DataPackTag.getEntryId(v) === id)
	}

	add(value: TagEntry) {
		const existingEntry = this.get(value)
		if (existingEntry) return
		this.values.push(value)
	}

	get(value: TagEntry) {
		const id = DataPackTag.getEntryId(value)
		return this.values.find(v => DataPackTag.getEntryId(v) === id)
	}

	filter(predicate: (value: TagEntry, index: number, array: TagEntry[]) => boolean) {
		this.values = this.values.filter(predicate)
		return this
	}

	merge(other: DataPackTag) {
		this.replace = other.replace

		for (const value of other.values) {
			this.add(value)
		}

		return this
	}

	sort() {
		this.values.sort((a, b) => {
			const idA = DataPackTag.getEntryId(a)
			const idB = DataPackTag.getEntryId(b)
			if (idA === 'animated_java:global/on_tick') return 1
			if (idB === 'animated_java:global/on_tick') return -1
			return idA.localeCompare(idB, 'en')
		})

		return this
	}

	static getEntryId(entry: TagEntry) {
		return typeof entry === 'string' ? entry : entry.id
	}

	static fromJSON(json: FunctionTagJSON) {
		const tag = new DataPackTag()
		if (typeof json.replace === 'boolean') tag.replace = json.replace
		if (Array.isArray(json.values)) tag.values = structuredClone(json.values)
		return tag
	}

	toJSON(): FunctionTagJSON {
		return { replace: this.replace, values: structuredClone(this.values) }
	}
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

export async function validateItem(item: string) {
	const itemRegistry = await getRegistryEntry(
		Project.animated_java.target_minecraft_version,
		'item'
	)

	let [namespace, id] = item.split(':')
	if (!id) {
		id = namespace
		namespace = 'minecraft'
	}
	if ((namespace === 'minecraft' || namespace === '') && itemRegistry.has(id)) {
		return ''
	} else {
		return `This item does not exist in Minecraft ${Project.animated_java.target_minecraft_version}.`
	}
}

export async function validateBlock(block: string) {
	const blockRegistry = await getRegistryEntry(
		Project.animated_java.target_minecraft_version,
		'block'
	)
	const parsed = await parseBlock(block)
	if (!parsed) {
		return 'Invalid block ID.'
	} else if (
		(parsed.resource.namespace === 'minecraft' || parsed.resource.namespace === '') &&
		blockRegistry.has(parsed.resource.name)
	) {
		return validateBlockState(parsed)
	} else {
		return `This block does not exist in Minecraft ${Project.animated_java.target_minecraft_version}.`
	}
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
		resourceLocation: resource.namespace + ':' + resource.path,
		states,
		blockStateRegistryEntry: await getBlockState(resource.name),
	}
}

export function sortMCVersions(versions: string[]): string[] {
	return versions.sort((a, b) => {
		return compareVersions(a, b) ? -1 : 1
	})
}

export function functionReferenceExists(dataPackRoot: string, resourceLocation: string): boolean {
	const parsed = parseResourceLocation(resourceLocation)
	if (!parsed) return false
	if (parsed.type !== 'tags' && parsed.type !== 'function' && parsed.type !== 'functions')
		return false

	const { readdirSync, statSync, existsSync } = getFsModule()

	for (const folder of readdirSync(dataPackRoot)) {
		const dataFolder = PathModule.join(dataPackRoot, folder)
		if (!statSync(dataFolder).isDirectory()) continue

		const path = PathModule.join(dataFolder, parsed.fullPath)
		if (!existsSync(path)) continue
		return true
	}

	return false
}
