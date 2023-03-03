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

const TWO_DAYS = 172800000
const MAX_RETRIES = 5

export class RegistryLoader {
	key: string
	url: string
	constructor(key: string, url: string) {
		this.url = url
		this.key = key
	}

	get lastTime() {
		const local = localStorage.getItem(`${this.key}.lastTime`)
		if (local) return Number(local)
		return 0
	}

	get localValue() {
		const local = localStorage.getItem(this.key)
		if (local) {
			try {
				return JSON.parse(local) as IRegistryJSON
			} catch (err) {
				console.log('Failed to parse local registry', err)
			}
		}
	}

	async load(): Promise<IRegistryJSON> {
		const lastTime = this.lastTime
		const now = Date.now()
		if (lastTime && now - lastTime >= TWO_DAYS) {
			localStorage.setItem(`${this.key}.lastTime`, String(now))
			console.log(`Local registry for ${this.key} out of date, Updating...`)
			return await this.fetch()
		}

		const local = this.localValue
		if (!local) {
			console.log(`No local registry found for ${this.key}. Collecting...`)
			return await this.fetch()
		}
		console.log(`Local registry for ${this.key} found. Loading...`)
		return local
	}

	async fetch() {
		const url = this.url
		let retries = 0
		const json = await new Promise<IRegistryJSON>(function request(resolve, reject) {
			fetch(url)
				.then(r => {
					if (r) resolve(r.json())
				})
				.catch((err: Error) => {
					console.log(
						`Failed to get Minecraft registry (${err.message}). Retrying in 1 second...`
					)
					retries++
					if (retries > MAX_RETRIES)
						reject(
							'Failed to download Minecraft Registry. Are you connected to the internet?'
						)
					setTimeout(request, 50)
				})
		})

		localStorage.setItem(this.key, JSON.stringify(json))
		return json
	}
}

const REGISTRY = new RegistryLoader(
	`animated-java<minecraftRegistry>`,
	'https://raw.githubusercontent.com/misode/mcmeta/summary/registries/data.json'
)
export const registry = REGISTRY.load()
