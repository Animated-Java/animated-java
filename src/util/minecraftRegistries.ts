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

interface IMinecraftVersion {
	id: string
	name: string
	release_target: string | null
	type: 'snapshot' | 'release'
	stable: boolean
	data_version: number
	protocol_version: number
	data_pack_version: number
	resource_pack_version: number
	build_time: string
	release_time: string
	sha1: string
}

const LATEST_VERSION_URL = 'https://raw.githubusercontent.com/misode/mcmeta/summary/version.json'
const REGISTRIES_URL =
	'https://raw.githubusercontent.com/misode/mcmeta/summary/registries/data.json'

class MinecraftRegistryEntry {
	public items: string[] = []

	constructor(entries: string[]) {
		this.items = entries
	}

	public has(item: string): boolean {
		return this.items.includes(item)
	}

	public find(searchFunction: (item: string) => boolean): string | undefined {
		return this.items.find(searchFunction)
	}
}

type MinecraftRegistry = Record<keyof IRegistryJSON, MinecraftRegistryEntry>

export const MINECRAFT_REGISTRY = {} as MinecraftRegistry

function updateMemoryRegistry() {
	const registryString = localStorage.getItem('animated_java:minecraftRegistry')
	if (!registryString) {
		console.error('Minecraft Registry not found in local storage')
		return
	}
	const registry = JSON.parse(registryString) as IRegistryJSON
	for (const key in registry) {
		MINECRAFT_REGISTRY[key as keyof IRegistryJSON] = new MinecraftRegistryEntry(
			registry[key as keyof IRegistryJSON]
		)
	}
}

async function updateLocalRegistry() {
	console.log('Updating Minecraft Registry...')
	let retries = 3
	while (retries-- >= 0) {
		let response
		try {
			response = await fetch(REGISTRIES_URL)
		} catch (error) {
			console.error('Failed to fetch latest Minecraft registry:', error)
		}
		if (response && response.ok) {
			const newRegistry = (await response.json()) as IRegistryJSON
			localStorage.setItem('animated_java:minecraftRegistry', JSON.stringify(newRegistry))
			const latestVersion = await getLatestVersion()
			localStorage.setItem(
				'animated_java:minecraftRegistryVersion',
				JSON.stringify(latestVersion)
			)
			console.log('Minecraft Registry updated!')
			return
		}
	}
	throw new Error('Failed to fetch latest Minecraft registry after 3 retries.')
}

async function getLatestVersion(): Promise<IMinecraftVersion> {
	console.log('Fetching latest Minecraft version...')
	let retries = 3
	while (retries-- >= 0) {
		let response
		try {
			response = await fetch(LATEST_VERSION_URL)
		} catch (error) {
			console.error('Failed to fetch latest Minecraft version:', error)
		}
		if (response && response.ok) {
			return (await response.json()) as IMinecraftVersion
		}
	}
	throw new Error('Failed to fetch latest Minecraft version after 3 retries.')
}

export async function checkIfRegistryNeedsUpdate() {
	console.log('Checking if Minecraft Registry needs an update')
	const currentValueString = localStorage.getItem('animated_java:minecraftRegistry')
	if (!currentValueString) {
		await updateLocalRegistry()
		return
	}
	const currentVersionString = localStorage.getItem('animated_java:minecraftRegistryVersion')
	if (!currentVersionString) {
		await updateLocalRegistry()
		return
	}
	const currentVersion = JSON.parse(currentVersionString) as IMinecraftVersion
	const latestVersion = await getLatestVersion()
	if (currentVersion.id !== latestVersion.id) {
		await updateLocalRegistry()
		return
	}

	console.log('Minecraft Registry is up to date')
	updateMemoryRegistry()
}

void checkIfRegistryNeedsUpdate()
