type DisplayContext =
	| 'none'
	| 'thirdperson_lefthand'
	| 'thirdperson_righthand'
	| 'firstperson_lefthand'
	| 'firstperson_righthand'
	| 'head'
	| 'gui'
	| 'ground'
	| 'fixed'

type TintSource =
	| {
			type: 'minecraft:constant'
			value: [number, number, number]
	  }
	| {
			type:
				| 'minecraft:dye'
				| 'minecraft:firework'
				| 'minecraft:potion'
				| 'minecraft:map_color'
				| 'team'
			default: [number, number, number]
	  }
	| {
			type: 'minecraft:grass'
			temperature: number
			downfall: number
	  }
	| {
			type: 'minecraft:custom_model_data'
			index?: number
			default: [number, number, number]
	  }

type ItemModel = {
	tints?: TintSource[]
} & (
	| {
			type: 'minecraft:model'
			model: string
	  }
	| {
			type: 'minecraft:composite'
			models: ItemModel[]
	  }
	| ConditionModel
	| SelectModel
)
// 'minecraft:select': SelectModel
// 'minecraft:range_dispatch': {}
// 'minecraft:bundle/selected_item': {}
// 'minecraft:empty': {}
// 'minecraft:special': {}

type ConditionModel = {
	type: 'minecraft:condition'
	on_true: ItemModel
	on_false: ItemModel
} & (
	| { property: 'minecraft:using_item' }
	| { property: 'minecraft:broken' }
	| { property: 'minecraft:damaged' }
	| {
			property: 'minecraft:has_component'
			component: string
			ignore_default?: boolean
	  }
	| { property: 'minecraft:fishing_rod/cast' }
	| { property: 'minecraft:bundle/has_selected_item' }
	| { property: 'minecraft:selected' }
	| { property: 'minecraft:carried' }
	| { property: 'minecraft:extended_view' }
	| {
			property: 'minecraft:keybind_down'
			key: string
	  }
	| { property: 'minecraft:view_entity' }
	| {
			property: 'minecraft:custom_model_data'
			index: number
	  }
)

type SelectModel = {
	type: 'minecraft:select'
	cases: Array<{
		model: ItemModel
	}>
	fallback?: ItemModel
} & (
	| {
			property: 'minecraft:main_hand'
			cases: Array<{ when: 'left' | 'right' }>
	  }
	| {
			property: 'minecraft:charge_type'
			cases: Array<{ when: 'none' | 'rocket' | 'arrow' }>
	  }
	| {
			property: 'minecraft:trim_material'
			cases: Array<{ when: string }>
	  }
	| {
			property: 'minecraft:block_state'
			block_state_property: string
			cases: Array<{ when: string }>
	  }
	| {
			property: 'minecraft:display_context'
			cases: Array<{ when: DisplayContext }>
	  }
	| {
			property: 'minecraft:local_time'
			locale: string
			time_zone?: string
			pattern?: string
			cases: Array<{ when: string }>
	  }
	| {
			property: 'minecraft:dimension'
			cases: Array<{ when: string }>
	  }
	| {
			property: 'minecraft:context_entity_type'
			cases: Array<{ when: string }>
	  }
	| {
			property: 'minecraft:custom_model_data'
			cases: Array<{ when: string }>
			index?: number
	  }
)

export interface IItemDefinition {
	model: ItemModel
	hand_animation_on_swap?: boolean
}
