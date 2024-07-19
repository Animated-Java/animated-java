import { makeNotZero } from '../util/misc'

export class ResizableOutlinerElement extends OutlinerElement {
	// Properties
	public name: string
	public position: ArrayVector3
	public rotation: ArrayVector3
	public scale: ArrayVector3
	public visibility: boolean
	// eslint-disable-next-line @typescript-eslint/naming-convention
	public preview_controller = PREVIEW_CONTROLLER

	// Transform flags
	public movable = true
	public rotatable = true
	public scalable = true
	public resizable = true

	// Resizable Workaround properties
	get from() {
		return this.position
	}
	set from(value: ArrayVector3) {
		this.position = value
	}
	get to() {
		return [0, 0, 0]
	}
	get stretch() {
		return []
	}
	// eslint-disable-next-line @typescript-eslint/naming-convention
	get uv_offset() {
		return []
	}

	constructor(data: any, uuid = guid()) {
		super(data, uuid)

		this.extend(data)

		this.name ??= 'resizable_outliner_element'
		this.position ??= [0, 0, 0]
		this.rotation ??= [0, 0, 0]
		this.scale ??= [1, 1, 1]
		this.visibility ??= true

		// this.sanitizeName()
	}

	get origin() {
		return this.position
	}

	getWorldCenter(): THREE.Vector3 {
		Reusable.vec3.set(0, 0, 0)
		// @ts-ignore
		return THREE.fastWorldPosition(this.mesh, Reusable.vec2).add(Reusable.vec3) as THREE.Vector3
	}

	public extend(data: any) {
		for (const key in ResizableOutlinerElement.properties) {
			ResizableOutlinerElement.properties[key].merge(this, data)
		}
		if (data.visibility !== undefined) {
			this.visibility = data.visibility
		}

		return this
	}

	selectLow() {
		Project!.selected_elements.safePush(this)
		this.selected = true
		TickUpdates.selection = true
		return this
	}

	size(axis?: number, floored?: boolean) {
		if (axis === undefined) {
			if (floored) return this.scale.map(n => Math.floor(n))
			return [...this.scale]
		}
		if (floored) return Math.floor(this.scale[axis])
		return this.scale[axis]
	}

	private oldScale: ArrayVector3 | undefined
	resize(
		val: number | ((n: number) => number),
		axis: number
		// negative: boolean,
		// allowNegative: boolean,
		// bidirectional: boolean
	) {
		let before = this.oldScale !== undefined ? this.oldScale : this.size(axis)
		if (before instanceof Array) before = before[axis]
		// For some unknown reason scale is not inverted on the y axis
		const sign = before < 0 && axis !== 1 ? -1 : 1

		const modify = typeof val === 'function' ? val : (n: number) => n + (val * sign) / 16

		this.scale[axis] = modify(before)

		this.preview_controller.updateGeometry?.(this)
		this.preview_controller.updateTransform(this)
	}
}
new Property(ResizableOutlinerElement, 'string', 'name', { default: 'resizable_outliner_element' })
new Property(ResizableOutlinerElement, 'vector', 'position', { default: [0, 0, 0] })
new Property(ResizableOutlinerElement, 'vector', 'rotation', { default: [0, 0, 0] })
new Property(ResizableOutlinerElement, 'vector', 'scale', { default: [1, 1, 1] })
new Property(ResizableOutlinerElement, 'string', 'visibility', { default: true })

export const PREVIEW_CONTROLLER = new NodePreviewController(ResizableOutlinerElement, {
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
		// el.preview_controller.updateTransform(el)
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
		if (el.mesh.fix_scale) {
			el.mesh.fix_scale.set(...el.scale)
			makeNotZero(el.mesh.fix_scale)
		}
		// @ts-ignore
		el.preview_controller.dispatchEvent('update_transform', { element: el })
	},
})
