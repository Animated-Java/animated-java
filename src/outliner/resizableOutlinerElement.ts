import { makeNotZero } from '../util/misc'
import { fixClassPropertyInheritance } from '../util/property'

@fixClassPropertyInheritance
export class ResizableOutlinerElement extends OutlinerElement {
	type = 'resizable'
	// Properties
	name: string
	position: ArrayVector3
	rotation: ArrayVector3
	scale: ArrayVector3
	visibility: boolean
	color!: number
	// @ts-expect-error - Is defined externally
	// eslint-disable-next-line @typescript-eslint/naming-convention
	preview_controller = PREVIEW_CONTROLLER

	static behavior = {
		select_faces: false,
		cube_faces: false,
		movable: true,
		resizable: true,
		rotatable: true,
		unique_name: true,
	}

	// eslint-disable-next-line @typescript-eslint/naming-convention
	get uv_offset() {
		return []
	}

	get origin() {
		return this.position
	}

	constructor(data: any, uuid = guid()) {
		super(data, uuid)

		this.extend(data)

		this.name ??= 'resizable_outliner_element'
		this.position ??= [0, 0, 0]
		this.rotation ??= [0, 0, 0]
		this.scale ??= [1, 1, 1]
		this.visibility ??= true
	}

	getWorldCenter(): THREE.Vector3 {
		Reusable.vec3.set(0, 0, 0)
		// @ts-expect-error fastWorldPosition types are wrong
		return THREE.fastWorldPosition(this.mesh, Reusable.vec2).add(Reusable.vec3) as THREE.Vector3
	}

	extend(data: any) {
		const properties = this.constructor.properties
		for (const key in properties) {
			properties[key]!.merge(this, data)
		}
		return this
	}

	selectLow() {
		Project!.selected_elements.safePush(this)
		this.selected = true
		TickUpdates.selection = true
		return this
	}

	setColor(color: number) {
		this.color = color
		this.preview_controller.updateGeometry?.(this)
		this.preview_controller.updateHighlight?.(this)
		return this
	}

	getSize(axis?: number) {
		return this.size(axis)
	}

	size(axis?: number, floored?: boolean): number | ArrayVector3 {
		if (axis === undefined) {
			if (floored) return this.scale.map(n => Math.floor(n)) as ArrayVector3
			return this.scale.slice() as ArrayVector3
		}
		if (floored) return Math.floor(this.scale[axis])
		return this.scale[axis]
	}

	resize(
		val: number | ((n: number) => number),
		axis: number,
		negative: boolean,
		_allowNegative: boolean,
		_bidirectional: boolean
	) {
		let before = this.temp_data.old_size ?? this.size(axis)
		if (before instanceof Array) before = before[axis]
		// For some unknown reason scale is not inverted on the y axis
		let sign = before < 0 && axis !== 1 ? -1 : 1
		if (negative) sign *= -1

		const modify = typeof val === 'function' ? val : (n: number) => n + (val * sign) / 16

		this.scale[axis] = modify(before)

		this.preview_controller.updateGeometry?.(this)
		this.preview_controller.updateTransform(this)

		return this
	}

	getSaveCopy() {
		const save = super.getSaveCopy?.() ?? {}
		save.uuid = this.uuid
		save.type = this.type
		return save
	}
}
new Property(ResizableOutlinerElement, 'string', 'name', { default: 'resizable_outliner_element' })
new Property(ResizableOutlinerElement, 'vector', 'position', { default: [0, 0, 0] })
new Property(ResizableOutlinerElement, 'vector', 'rotation', { default: [0, 0, 0] })
new Property(ResizableOutlinerElement, 'vector', 'pivotOffset', { default: [0, 0, 0] })
new Property(ResizableOutlinerElement, 'vector', 'scale', { default: [1, 1, 1] })
new Property(ResizableOutlinerElement, 'number', 'color', {
	default: () => Math.floor(Math.random() * markerColors.length),
})
new Property(ResizableOutlinerElement, 'boolean', 'visibility', { default: true })
new Property(ResizableOutlinerElement, 'boolean', 'locked', { default: false })
new Property(ResizableOutlinerElement, 'boolean', 'export', { default: true })

export const PREVIEW_CONTROLLER: NodePreviewController = new NodePreviewController(
	ResizableOutlinerElement,
	{
		setup(el: ResizableOutlinerElement) {
			const mesh = new THREE.Mesh()
			mesh.isElement = true
			mesh.fix_rotation = new THREE.Euler(0, 0, 0, 'ZYX')
			mesh.fix_rotation.x = Math.degToRad(el.rotation[0])
			mesh.fix_rotation.y = Math.degToRad(el.rotation[1])
			mesh.fix_rotation.z = Math.degToRad(el.rotation[2])
			mesh.fix_position = new THREE.Vector3(...el.position)
			mesh.fix_scale = new THREE.Vector3(...el.scale)
			Project!.nodes_3d[el.uuid] = mesh

			el.preview_controller.updateGeometry?.(el)
			el.preview_controller.dispatchEvent('setup', { element: el })
		},

		updateTransform(el: ResizableOutlinerElement) {
			NodePreviewController.prototype.updateTransform.call(el.preview_controller, el)
			if (el.mesh.fix_position) {
				el.mesh.fix_position.set(...el.position)
				if (el.parent instanceof Group) {
					el.mesh.fix_position.x -= el.parent.origin[0]
					el.mesh.fix_position.y -= el.parent.origin[1]
					el.mesh.fix_position.z -= el.parent.origin[2]
				}
			}
			if (el.mesh.fix_rotation) {
				el.mesh.fix_rotation.copy(el.mesh.rotation)
			}
			el.mesh.scale.set(...el.scale)
			makeNotZero(el.mesh.scale)
			if (el.mesh.fix_scale) {
				el.mesh.fix_scale.set(...el.scale)
				makeNotZero(el.mesh.fix_scale)
			}
			el.preview_controller.dispatchEvent('update_transform', { element: el })
		},
	}
)
