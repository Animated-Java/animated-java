import ky from 'ky'
import { join } from 'node:path'
import { getFsModule } from '../../constants'

interface IRegistryJSON {
	activity: string[]
	advancement: string[]
	attribute: string[]
	block: string[]
	block_definition: string[]
	block_entity_type: string[]
	block_predicate_type: string[]
	chunk_status: string[]
	custom_stat: string[]
	dimension: string[]
	dimension_type: string[]
	enchantment: string[]
	entity_type: string[]
	float_provider_type: string[]
	fluid: string[]
	font: string[]
	function: string[]
	game_event: string[]
	height_provider_type: string[]
	int_provider_type: string[]
	item: string[]
	item_modifier: string[]
	loot_condition_type: string[]
	loot_function_type: string[]
	loot_nbt_provider_type: string[]
	loot_number_provider_type: string[]
	loot_pool_entry_type: string[]
	loot_score_provider_type: string[]
	loot_table: string[]
	memory_module_type: string[]
	menu: string[]
	mob_effect: string[]
	model: string[]
	motive: string[]
	particle_type: string[]
	point_of_interest_type: string[]
	pos_rule_test: string[]
	position_source_type: string[]
	potion: string[]
	predicate: string[]
	recipe: string[]
	recipe_serializer: string[]
	recipe_type: string[]
	rule_test: string[]
	schedule: string[]
	sensor_type: string[]
	sound_event: string[]
	stat_type: string[]
	structure: string[]
	'tag/block': string[]
	'tag/entity_type': string[]
	'tag/fluid': string[]
	'tag/game_event': string[]
	'tag/item': string[]
	texture: string[]
	villager_profession: string[]
	villager_type: string[]
	'worldgen/biome': string[]
	'worldgen/biome_source': string[]
	'worldgen/block_state_provider_type': string[]
	'worldgen/carver': string[]
	'worldgen/chunk_generator': string[]
	'worldgen/configured_carver': string[]
	'worldgen/configured_feature': string[]
	'worldgen/configured_structure_feature': string[]
	'worldgen/configured_surface_builder': string[]
	'worldgen/feature': string[]
	'worldgen/feature_size_type': string[]
	'worldgen/foliage_placer_type': string[]
	'worldgen/material_condition': string[]
	'worldgen/material_rule': string[]
	'worldgen/noise': string[]
	'worldgen/noise_settings': string[]
	'worldgen/placed_feature': string[]
	'worldgen/placement_modifier_type': string[]
	'worldgen/processor_list': string[]
	'worldgen/structure_feature': string[]
	'worldgen/structure_piece': string[]
	'worldgen/structure_placement': string[]
	'worldgen/structure_pool_element': string[]
	'worldgen/structure_processor': string[]
	'worldgen/template_pool': string[]
	'worldgen/tree_decorator_type': string[]
	'worldgen/trunk_placer_type': string[]
}

class MinecraftRegistryEntry {
	items: string[] = []

	constructor(entries: string[]) {
		this.items = entries
	}

	has(item: string): boolean {
		return this.items.includes(item)
	}

	find(searchFunction: (item: string) => boolean): string | undefined {
		return this.items.find(searchFunction)
	}

	static createRegistry(registry: IRegistryJSON): MinecraftRegistry {
		const result = {} as MinecraftRegistry
		for (const key in registry) {
			result[key as keyof IRegistryJSON] = new MinecraftRegistryEntry(
				registry[key as keyof IRegistryJSON]
			)
		}
		return result
	}
}

type MinecraftRegistry = Record<keyof IRegistryJSON, MinecraftRegistryEntry>

const REGISTRIES_URL =
	'https://raw.githubusercontent.com/misode/mcmeta/summary/registries/data.json'
const REGISTRY_CACHE_FOLDER = join(SystemInfo.user_data_directory, 'animated_java/registries')

const REGISTRY_CACHE = new Map<string, MinecraftRegistry>()

async function fetchRegistry(versionId: string) {
	const response = await ky<IRegistryJSON>(REGISTRIES_URL).json()
	if (!response) {
		throw new Error('Failed to fetch Minecraft registry data!')
	}
	const { mkdir, writeFile } = getFsModule().promises
	await mkdir(REGISTRY_CACHE_FOLDER, { recursive: true })
	await writeFile(join(REGISTRY_CACHE_FOLDER, `${versionId}.json`), JSON.stringify(response))
	return MinecraftRegistryEntry.createRegistry(response)
}

async function loadRegistryFromCache(versionId: string) {
	const { readFile } = getFsModule().promises
	const registryData = await readFile(join(REGISTRY_CACHE_FOLDER, `${versionId}.json`), 'utf-8')
	const registry = JSON.parse(registryData) as IRegistryJSON
	const typedRegistry: MinecraftRegistry = MinecraftRegistryEntry.createRegistry(registry)
	REGISTRY_CACHE.set(versionId, typedRegistry)
	return typedRegistry
}

export async function getRegistry(versionId: string) {
	if (REGISTRY_CACHE.has(versionId)) {
		return REGISTRY_CACHE.get(versionId)!
	}

	const { existsSync } = getFsModule()

	if (existsSync(join(REGISTRY_CACHE_FOLDER, `${versionId}.json`))) {
		return await loadRegistryFromCache(versionId)
	}

	try {
		const registry = await fetchRegistry(versionId)
		REGISTRY_CACHE.set(versionId, registry)
		return registry
	} catch (error) {
		console.error('Failed to fetch Minecraft registry from network:', error)
		if (existsSync(join(REGISTRY_CACHE_FOLDER, `${versionId}.json`))) {
			console.log('Loading Minecraft registry from cache...')
			return await loadRegistryFromCache(versionId)
		}
		throw new Error('Failed to load Minecraft registry from both network and cache!')
	}
}

export async function getRegistryEntry<K extends keyof IRegistryJSON>(
	versionId: string,
	registryName: K
) {
	const registry = await getRegistry(versionId)
	if (!registry[registryName]) {
		throw new Error(`Minecraft registry '${registryName}' not found in memory!`)
	}
	return registry[registryName]
}
