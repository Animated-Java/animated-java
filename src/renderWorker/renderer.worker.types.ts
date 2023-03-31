export interface DataHiarchy {}
export interface AnimationDataBundle {
	keyframes: {
		[key: string]: {
			bezier: {
				left_time: number
				left_value: number
				right_time: number
				right_value: number
				linked: boolean
			}
			data_points: {
				x: number
				y: number
				z: number
			}[]
			time: number
			interpolation: number
			channel: string
		}[]
	}
	length: number
}

export interface DataOutliner {
	id: string
	rot: ArrayVector3
	origin: ArrayVector3
	children: DataOutliner[]
}

export type Data = {
	outliner: DataOutliner
	animation: AnimationDataBundle
}
export type Result = {}
