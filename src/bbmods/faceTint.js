import { format as modelFormat } from '../modelFormat'
import { bus } from '../util/bus'
import * as EVENTS from '../constants/events'

// const originalFaceTintCondition = BarItems.face_tint.condition
// const originalFaceTintSliderCondition = BarItems.slider_face_tint.condition
BarItems.face_tint.condition = () =>
	!Project.box_uv &&
	(Format.id === 'java_block' || Format.id === modelFormat.id) &&
	Cube.selected.length &&
	UVEditor.selected_faces[0] &&
	Cube.selected[0].faces[UVEditor.selected_faces[0]]

BarItems.slider_face_tint.condition = () =>
	!Project.box_uv &&
	(Format.id === 'java_block' || Format.id === modelFormat.id) &&
	Cube.selected.length &&
	UVEditor.selected_faces[0] &&
	Cube.selected[0].faces[UVEditor.selected_faces[0]]
