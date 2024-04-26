import { PACKAGE } from '../constants'
import { events } from '../util/events'
import { createBlockbenchMod } from '../util/moddingTools'
import MolangFunctionFile from './functions.molang'

const GLOBAL_VARIABLES = Animator.MolangParser.global_variables

const ROOT_TOKENS = [
	'true',
	'false',
	'math.',
	'query.', //'q.',
	'variable.', //'v.',
	'temp.', //'t.',
	'context.', //'c.',
	'this',
	'loop()',
	'return',
	'break',
	'continue',
]
const MOLANG_QUERIES = [
	// common
	'all_animations_finished',
	'any_animation_finished',
	'anim_time',
	'life_time',
	'yaw_speed',
	'ground_speed',
	'vertical_speed',
	'property',
	'has_property()',
	'variant',
	'mark_variant',
	'skin_id',

	'above_top_solid',
	'actor_count',
	'all()',
	'all_tags',
	'anger_level',
	'any()',
	'any_tag',
	'approx_eq()',
	'armor_color_slot',
	'armor_material_slot',
	'armor_texture_slot',
	'average_frame_time',
	'blocking',
	'body_x_rotation',
	'body_y_rotation',
	'bone_aabb',
	'bone_origin',
	'bone_rotation',
	'camera_distance_range_lerp',
	'camera_rotation()',
	'can_climb',
	'can_damage_nearby_mobs',
	'can_dash',
	'can_fly',
	'can_power_jump',
	'can_swim',
	'can_walk',
	'cape_flap_amount',
	'cardinal_facing',
	'cardinal_facing_2d',
	'cardinal_player_facing',
	'combine_entities()',
	'count',
	'current_squish_value',
	'dash_cooldown_progress',
	'day',
	'death_ticks',
	'debug_output',
	'delta_time',
	'distance_from_camera',
	'effect_emitter_count',
	'effect_particle_count',
	'equipment_count',
	'equipped_item_all_tags',
	'equipped_item_any_tag()',
	'equipped_item_is_attachable',
	'eye_target_x_rotation',
	'eye_target_y_rotation',
	'facing_target_to_range_attack',
	'frame_alpha',
	'get_actor_info_id',
	'get_animation_frame',
	'get_default_bone_pivot',
	'get_locator_offset',
	'get_root_locator_offset',
	'had_component_group()',
	'has_any_family()',
	'has_armor_slot',
	'has_biome_tag',
	'has_block_property',
	'has_cape',
	'has_collision',
	'has_dash_cooldown',
	'has_gravity',
	'has_owner',
	'has_rider',
	'has_target',
	'head_roll_angle',
	'head_x_rotation',
	'head_y_rotation',
	'health',
	'heartbeat_interval',
	'heartbeat_phase',
	'heightmap',
	'hurt_direction',
	'hurt_time',
	'in_range()',
	'invulnerable_ticks',
	'is_admiring',
	'is_alive',
	'is_angry',
	'is_attached_to_entity',
	'is_avoiding_block',
	'is_avoiding_mobs',
	'is_baby',
	'is_breathing',
	'is_bribed',
	'is_carrying_block',
	'is_casting',
	'is_celebrating',
	'is_celebrating_special',
	'is_charged',
	'is_charging',
	'is_chested',
	'is_critical',
	'is_croaking',
	'is_dancing',
	'is_delayed_attacking',
	'is_digging',
	'is_eating',
	'is_eating_mob',
	'is_elder',
	'is_emerging',
	'is_emoting',
	'is_enchanted',
	'is_fire_immune',
	'is_first_person',
	'is_ghost',
	'is_gliding',
	'is_grazing',
	'is_idling',
	'is_ignited',
	'is_illager_captain',
	'is_in_contact_with_water',
	'is_in_love',
	'is_in_ui',
	'is_in_water',
	'is_in_water_or_rain',
	'is_interested',
	'is_invisible',
	'is_item_equipped',
	'is_item_name_any()',
	'is_jump_goal_jumping',
	'is_jumping',
	'is_laying_down',
	'is_laying_egg',
	'is_leashed',
	'is_levitating',
	'is_lingering',
	'is_moving',
	'is_name_any()',
	'is_on_fire',
	'is_on_ground',
	'is_on_screen',
	'is_onfire',
	'is_orphaned',
	'is_owner_identifier_any()',
	'is_persona_or_premium_skin',
	'is_playing_dead',
	'is_powered',
	'is_pregnant',
	'is_ram_attacking',
	'is_resting',
	'is_riding',
	'is_roaring',
	'is_rolling',
	'is_saddled',
	'is_scared',
	'is_selected_item',
	'is_shaking',
	'is_shaking_wetness',
	'is_sheared',
	'is_shield_powered',
	'is_silent',
	'is_sitting',
	'is_sleeping',
	'is_sneaking',
	'is_sneezing',
	'is_sniffing',
	'is_sonic_boom',
	'is_spectator',
	'is_sprinting',
	'is_stackable',
	'is_stalking',
	'is_standing',
	'is_stunned',
	'is_swimming',
	'is_tamed',
	'is_transforming',
	'is_using_item',
	'is_wall_climbing',
	'item_in_use_duration',
	'item_is_charged',
	'item_max_use_duration',
	'item_remaining_use_duration',
	'item_slot_to_bone_name()',
	'key_frame_lerp_time',
	'last_frame_time',
	'last_hit_by_player',
	'lie_amount',
	'life_span',
	'lod_index',
	'log',
	'main_hand_item_max_duration',
	'main_hand_item_use_duration',
	'max_durability',
	'max_health',
	'max_trade_tier',
	'maximum_frame_time',
	'minimum_frame_time',
	'model_scale',
	'modified_distance_moved',
	'modified_move_speed',
	'moon_brightness',
	'moon_phase',
	'movement_direction',
	'noise',
	'on_fire_time',
	'out_of_control',
	'player_level',
	'position()',
	'position_delta()',
	'previous_squish_value',
	'remaining_durability',
	'roll_counter',
	'rotation_to_camera()',
	'shake_angle',
	'shake_time',
	'shield_blocking_bob',
	'show_bottom',
	'sit_amount',
	'sleep_rotation',
	'sneeze_counter',
	'spellcolor',
	'standing_scale',
	'structural_integrity',
	'surface_particle_color',
	'surface_particle_texture_coordinate',
	'surface_particle_texture_size',
	'swell_amount',
	'swelling_dir',
	'swim_amount',
	'tail_angle',
	'target_x_rotation',
	'target_y_rotation',
	'texture_frame_index',
	'time_of_day',
	'time_since_last_vibration_detection',
	'time_stamp',
	'total_emitter_count',
	'total_particle_count',
	'trade_tier',
	'unhappy_counter',
	'walk_distance',
	'wing_flap_position',
	'wing_flap_speed',
]
const MOLANG_QUERY_LABELS = {
	'in_range()': 'in_range( value, min, max )',
	'all()': 'in_range( value, values... )',
	'any()': 'in_range( value, values... )',
	'approx_eq()': 'in_range( value, values... )',
}
const DEFAULT_CONTEXT = [
	'item_slot',
	'block_face',
	'cardinal_block_face_placed_on',
	'is_first_person',
	'owning_entity',
	'player_offhand_arm_height',
	'other',
	'count',
]
const DEFAULT_VARIABLES = ['attack_time', 'is_first_person']
const MATH_FUNCTIONS = [
	'sin()',
	'cos()',
	'abs()',
	'clamp()',
	'pow()',
	'sqrt()',
	'random()',
	'ceil()',
	'round()',
	'trunc()',
	'floor()',
	'mod()',
	'min()',
	'max()',
	'exp()',
	'ln()',
	'lerp()',
	'lerprotate()',
	'pi',
	'asin()',
	'acos()',
	'atan()',
	'atan2()',
	'die_roll()',
	'die_roll_integer()',
	'hermite_blend()',
	'random_integer()',
]
const MATH_FUNCTION_LABELS = {
	'clamp()': 'clamp( value, min, max )',
	'pow()': 'pow( base, exponent )',
	'random()': 'random( low, high )',
	'mod()': 'mod( value, denominator )',
	'min()': 'min( A, B )',
	'max()': 'max( A, B )',
	'lerp()': 'lerp( start, end, 0_to_1 )',
	'lerprotate()': 'lerprotate( start, end, 0_to_1 )',
	'atan2()': 'atan2( y, x )',
	'die_roll()': 'die_roll( num, low, high )',
	'die_roll_integer()': 'die_roll_integer( num, low, high )',
	'random_integer()': 'random_integer( low, high )',
	'hermite_blend()': 'hermite_blend( 0_to_1 )',
}

const CUSTOM_FUNCTIONS: Record<string, (...args: number[]) => number> = {}
const CUSTOM_FUNCTION_LABELS: Record<string, string> = {}

for (const [call, body] of Object.entries(MolangFunctionFile)) {
	const match = call.match(/^(.+?)\((.*?)\)$/)
	if (!match) continue
	const name = match[1]
	const argList = match[2].split(',').map(v => v.trim())
	CUSTOM_FUNCTIONS[name] = (...args: number[]) => {
		const variables: Record<string, number> = {}
		for (let i = 0; i < args.length; i++) {
			variables[argList[i]] = args[i] || 0
		}
		return Animator.MolangParser.parse(body, variables)
	}
	CUSTOM_FUNCTION_LABELS[name] = name + '( ' + argList.join(', ') + ' )'
}

function getProjectVariables(current: string) {
	const set = new Set<string>()
	const expressions = getAllMolangExpressions()
	expressions.forEach((exp: MolangExpression) => {
		if (!exp.value) return
		const matches = exp.value.match(/(v|variable)\.\w+/gi)
		if (!matches) return
		matches.forEach(match => {
			const name = match.substring(match.indexOf('.') + 1)
			if (name !== current) set.add(name)
		})
	})
	return set
}

function filterAndSortList(
	list: string[],
	match: string,
	blacklist: string[] | false | undefined = false,
	labels: Record<string, string> | undefined = undefined
) {
	const result = list.filter(f => f.startsWith(match) && f.length != match.length)
	list.forEach(f => {
		if (!result.includes(f) && f.includes(match) && f.length != match.length) result.push(f)
	})
	if (blacklist) blacklist.forEach(black => result.remove(black))
	return result.map(text => {
		return { text, label: labels && labels[text], overlap: match.length }
	})
}

createBlockbenchMod(
	`${PACKAGE.name}:molangMod`,
	{
		originalAutocompleteMolang: Animator.autocompleteMolang,
		unsubscribeSelectAjProject: undefined as (() => void) | undefined,
		unsuscribeUnselectAjProject: undefined as (() => void) | undefined,
	},
	context => {
		context.unsubscribeSelectAjProject = events.SELECT_AJ_PROJECT.subscribe(() => {
			Object.assign(GLOBAL_VARIABLES, CUSTOM_FUNCTIONS)

			Animator.autocompleteMolang = function (text, position, type) {
				let beginning = text
					.substring(0, position)
					.split(/[^a-zA-Z_.]\.*/g)
					.last()
				if (!beginning) return []

				beginning = beginning.toLowerCase()
				if (beginning.includes('.')) {
					const [namespace, dir] = beginning.split('.')
					if (namespace == 'math') {
						return filterAndSortList(
							MATH_FUNCTIONS,
							dir,
							undefined,
							MATH_FUNCTION_LABELS
						)
					}
					if (namespace == 'query' || namespace == 'q') {
						return filterAndSortList(
							MOLANG_QUERIES,
							dir,
							type !== 'controller' && [
								'all_animations_finished',
								'any_animation_finished',
							],
							MOLANG_QUERY_LABELS
						)
					}
					if (namespace == 'temp' || namespace == 't') {
						const temps = text.match(/([^a-z]|^)t(emp)?\.\w+/gi)
						if (temps) {
							const temps2 = temps.map(t => t.split('.')[1])
							const temps3 = temps2.filter(
								(t, i) => t !== dir && temps2.indexOf(t) === i
							)
							return filterAndSortList(temps3, dir)
						}
					}
					if (namespace == 'context' || namespace == 'c') {
						return filterAndSortList([...DEFAULT_CONTEXT], dir)
					}
					if (namespace == 'variable' || namespace == 'v') {
						const options = [...getProjectVariables(dir)]
						options.safePush(...DEFAULT_VARIABLES)
						return filterAndSortList(options, dir)
					}
				} else {
					const root_tokens = ROOT_TOKENS.slice()
					let labels = {}
					if (type === 'placeholders') {
						labels = {
							'toggle()': 'toggle( name )',
							'slider()': 'slider( name, step?, min?, max? )',
							'impulse()': 'impulse( name, duration )',
						}
						root_tokens.push(...Object.keys(labels))
					}
					return filterAndSortList(
						[...root_tokens, ...Object.keys(CUSTOM_FUNCTION_LABELS)],
						beginning,
						undefined,
						{ ...labels, ...CUSTOM_FUNCTION_LABELS }
					)
				}
				return []
			}
		})

		context.unsuscribeUnselectAjProject = events.UNSELECT_AJ_PROJECT.subscribe(() => {
			for (const key of Object.keys(CUSTOM_FUNCTIONS)) {
				delete GLOBAL_VARIABLES[key]
			}
			Animator.autocompleteMolang = context.originalAutocompleteMolang
		})

		return context
	},
	context => {
		for (const key of Object.keys(CUSTOM_FUNCTIONS)) {
			delete GLOBAL_VARIABLES[key]
		}
		Animator.autocompleteMolang = context.originalAutocompleteMolang
		context.unsubscribeSelectAjProject?.()
		context.unsuscribeUnselectAjProject?.()
	}
)
