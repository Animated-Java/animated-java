import { getLatestVersion } from './versionManager'
import { events } from '../../util/events'
import { resolveBlockstateValueType } from '../../util/minecraftUtil'

type BlockStateRegistryJSON = Record<string, BlockStateRegistryData>

type BlockStateRegistryData = [Record<string, string[]>, Record<string, string>]

const REGISTRIES_URL = 'https://raw.githubusercontent.com/misode/mcmeta/summary/blocks/data.json'

export type BlockStateValue = string | number | boolean | Array<string | number | boolean>

export class BlockStateRegistryEntry {
	public defaultStates: Record<string, BlockStateValue> = {}
	public stateValues: Record<string, BlockStateValue[]> = {}

	constructor(blockstate: BlockStateRegistryData) {
		for (const [k, v] of Object.entries(blockstate[1])) {
			this.defaultStates[k] = resolveBlockstateValueType(v, false)
		}
		for (const [k, v] of Object.entries(blockstate[0])) {
			this.stateValues[k] = v.map(v => resolveBlockstateValueType(v, false))
		}
	}
}

type BlockStateRegistry = Record<string, BlockStateRegistryEntry>
export const BLOCKSTATE_REGISTRY = {} as BlockStateRegistry

function updateMemoryRegistry() {
	const registryString = localStorage.getItem('animated_java:blockStateRegistry')
	if (!registryString) {
		console.error('BlockState Registry not found in local storage')
		return
	}
	const registry = JSON.parse(registryString) as BlockStateRegistryJSON
	for (const key in registry) {
		BLOCKSTATE_REGISTRY[key] = new BlockStateRegistryEntry(registry[key])
	}
}

async function updateLocalRegistry() {
	console.log('Updating BlockState Registry...')
	let retries = 3
	while (retries-- >= 0) {
		let response
		try {
			response = await fetch(REGISTRIES_URL)
		} catch (error) {
			console.error('Failed to fetch latest BlockState registry:', error)
		}
		if (response && response.ok) {
			const newRegistry = (await response.json()) as BlockStateRegistryJSON
			localStorage.setItem('animated_java:blockStateRegistry', JSON.stringify(newRegistry))
			const latestVersion = await getLatestVersion()
			localStorage.setItem(
				'animated_java:blockStateRegistryVersion',
				JSON.stringify(latestVersion)
			)
			console.log('BlockState Registry updated!')
			return
		}
	}
	throw new Error('Failed to fetch latest BlockState registry after 3 retries.')
}

export async function checkForRegistryUpdate() {
	console.log('Checking if BlockState Registry update...')
	const currentValueString = localStorage.getItem('animated_java:blockStateRegistry')
	if (!currentValueString) {
		console.log('No BlockState Registry found. Updating...')
		await updateLocalRegistry()
		return
	}
	const currentVersionString = localStorage.getItem('animated_java:blockStateRegistryVersion')
	if (!currentVersionString) {
		console.log('No BlockState Registry version found. Updating...')
		await updateLocalRegistry()
		return
	}
	const currentVersion = JSON.parse(currentVersionString)
	const latestVersion = await getLatestVersion()
	if (currentVersion.id !== latestVersion.id) {
		console.log('BlockState Registry is outdated. Updating...')
		await updateLocalRegistry()
		return
	}

	console.log('BlockState Registry is up to date!')
	updateMemoryRegistry()
	requestAnimationFrame(() => events.BLOCKSTATE_REGISTRY_LOADED.dispatch())
}

export async function getBlockState(block: string) {
	if (Object.keys(BLOCKSTATE_REGISTRY).length === 0) {
		return new Promise<BlockStateRegistryEntry | undefined>(resolve => {
			events.BLOCKSTATE_REGISTRY_LOADED.subscribe(() => {
				resolve(BLOCKSTATE_REGISTRY[block])
			}, true)
		})
	}
	return BLOCKSTATE_REGISTRY[block]
}

events.LOAD.subscribe(() => {
	void checkForRegistryUpdate().catch(err => {
		console.error(err)
	})
})
