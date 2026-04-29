import { registerPatch, registerPropertyOverridePatch } from 'blockbench-patch-manager'
import {
	activeProjectIsBlueprintFormat,
	type IBlueprintInteractionConfigJSON,
} from '../formats/blueprint'
import { DisplayEntityConfig } from '../nodeConfigs'
import { sanitizeOutlinerElementName } from '../outliner/util'
import { DeepClonedObjectProperty } from '../util/property'

declare global {
	// @ts-expect-error - Broken BB Types
	interface BoundingBox {
		onSummonFunction: string
		config: IBlueprintInteractionConfigJSON
	}
}

registerPropertyOverridePatch({
	id: 'animated_java:bounding_box/square_horizontal_size/resize',
	target: BoundingBox.prototype,
	key: 'resize',

	get: function (this, value) {
		if (activeProjectIsBlueprintFormat()) {
			return function (
				this: BoundingBox,
				val: number | ((offset: number) => number),
				axis: axisNumber,
				negative?: boolean,
				allowNegative?: boolean,
				bidirectional?: boolean
			) {
				const result = value.call(this, val, axis, negative, allowNegative, bidirectional)

				if (axis === 0) {
					this.from = [this.from[0], this.from[1], this.from[0]]
					this.to = [this.to[0], this.to[1], this.to[0]]
				} else if (axis === 2) {
					this.from = [this.from[2], this.from[1], this.from[2]]
					this.to = [this.to[2], this.to[1], this.to[2]]
				}

				this.preview_controller.updateGeometry(this)
				TickUpdates.selection = true

				return result
			}
		}
		return value
	},
})

registerPropertyOverridePatch({
	id: 'animated_java:bounding_box/preview_controller/update_transform',
	target: BoundingBox.prototype.preview_controller,
	key: 'updateTransform',

	get: function (this, value) {
		if (activeProjectIsBlueprintFormat()) {
			console.log('Applying bounding box preview controller patch')
			return function (this: NodePreviewController, el: BoundingBox) {
				const mesh = el.mesh
				if (el.getTypeBehavior('movable')) {
					mesh.position.set(el.origin[0], el.origin[1], el.origin[2])
				}
				if (mesh.parent !== Project.model_3d) {
					Project.model_3d.add(mesh)
				}

				if (el.mesh.fix_position) {
					el.mesh.fix_position.set(...el.origin)
					if (el.parent instanceof Group) {
						el.mesh.fix_position.x -= el.parent.mesh.position.x
						el.mesh.fix_position.y -= el.parent.mesh.position.y
						el.mesh.fix_position.z -= el.parent.mesh.position.z
					}
				}
				if (el.mesh.fix_rotation) {
					el.mesh.fix_rotation.copy(el.mesh.rotation)
				}

				mesh.updateMatrixWorld()
				this.dispatchEvent('update_transform', { element: el })
				return
			}
		}
		return value
	},
})

registerPropertyOverridePatch({
	id: 'animated_java:bounding_box/preview_controller/setup',
	target: BoundingBox.prototype.preview_controller,
	key: 'setup',

	get: function (this, value) {
		if (activeProjectIsBlueprintFormat()) {
			return function (this: NodePreviewController, el: BoundingBox) {
				const result = value.call(this, el)

				const mesh = el.mesh
				mesh.fix_rotation = new THREE.Euler(0, 0, 0, 'ZYX')
				mesh.fix_position = new THREE.Vector3(...el.position)

				return result
			}
		}
		return value
	},
})

registerPatch({
	id: `animated_java:bounding_box/custom_properties`,

	apply: () => {
		const properties = [
			new Property(BoundingBox, 'string', 'onSummonFunction', {
				condition: activeProjectIsBlueprintFormat,
				default: '',
			}),
			new DeepClonedObjectProperty(BoundingBox, 'config', {
				condition: activeProjectIsBlueprintFormat,
				default: () => {
					return { default: new DisplayEntityConfig().toJSON(), variants: {} }
				},
			}),
		]

		return { properties }
	},

	revert: ({ properties }) => {
		properties.forEach(prop => prop.delete())
	},
})

registerPropertyOverridePatch({
	id: `animated_java:override_function/bounding_box/save_name`,
	target: BoundingBox.prototype,
	key: 'saveName',

	condition: () => activeProjectIsBlueprintFormat(),

	get: original => {
		return function (this: BoundingBox, save?: boolean) {
			this.name = sanitizeOutlinerElementName(this.name, this.uuid)
			return original.call(this, save)
		}
	},
})

registerPropertyOverridePatch({
	id: `animated_java:override_function/bounding_box/sanitize_name`,
	target: BoundingBox.prototype,
	key: 'sanitizeName',

	condition: () => activeProjectIsBlueprintFormat(),

	get: original => {
		return function (this: BoundingBox) {
			this.name = sanitizeOutlinerElementName(this.name, this.uuid)
			return original.call(this)
		}
	},
})
