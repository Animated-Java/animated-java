// @ts-ignore
declare type FaceNameString = 'north' | 'south' | 'east' | 'west' | 'up' | 'down'

// @ts-ignore
declare const UVEditor: {
	face: FaceNameString
	size: number
	zoom: number
	grid: number
	max_zoom: number
	auto_grid: number
	panel: number
	sliders: number
	vue: any

	jquery: any
	showing_overlays: boolean

	selected_faces: FaceNameString[]

	message(msg: string, vars: any): void
	getMappingOverlay(cube: Cube, absolute: boolean): Element
	getPixelSize(): number
}
