export type ModelDisplaySlot =
	| 'thirdperson_righthand'
	| 'thirdperson_lefthand'
	| 'firstperson_righthand'
	| 'firstperson_lefthand'
	| 'gui'
	| 'head'
	| 'ground'
	| 'fixed'

export type ItemModelFaceDirection = 'up' | 'down' | 'north' | 'south' | 'west' | 'east'

type ItemModelPredicateTypes =
	| 'angle'
	| 'blocking'
	| 'broken'
	| 'cast'
	| 'cooldown'
	| 'damage'
	| 'damaged'
	| 'lefthanded'
	| 'pull'
	| 'pulling'
	| 'charged'
	| 'firework'
	| 'throwing'
	| 'time'
	| 'custom_model_data'
	| 'level'
	| 'filled'
	| 'tooting'
	| 'trim_type'
	| 'brushing'

export interface IItemModelElementFace {
	uv: [number, number, number, number]
	texture: string
	cullface?: ItemModelFaceDirection
	rotation?: 0 | 90 | 180 | 270
	tintindex?: number
}

export interface IModelELement {
	from: [number, number, number]
	to: [number, number, number]
	rotation?: {
		origin: [number, number, number]
		axis: 'x' | 'y' | 'z'
		angle: number
		rescale: boolean
	}
	shade?: boolean
	faces?: Record<ItemModelFaceDirection, IItemModelElementFace | undefined>
}

export interface IItemModel {
	parent?: string
	textures: Record<string, string> & Record<`layer${number}`, string> & { particle?: string }
	display?: Record<
		ModelDisplaySlot,
		{
			rotation: [number, number, number]
			translation: [number, number, number]
			scale: [number, number, number]
		}
	>
	gui_light?: 'front' | 'side'
	elements?: IModelELement[]
	overrides?: {
		predicate: Record<ItemModelPredicateTypes, number>
		model: string
	}
}

export interface IBlockModel {
	parent?: string
	textures: Record<string, string> & Record<`layer${number}`, string> & { particle?: string }
	display?: Record<
		ModelDisplaySlot,
		{
			rotation: [number, number, number]
			translation: [number, number, number]
			scale: [number, number, number]
		}
	>
	ambientocclusion?: boolean
	elements?: IModelELement[]
}
