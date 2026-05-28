import { registerDeletableHandlerPatch, registerPatch } from 'blockbench-patch-manager'
import { observable } from 'svelte-observable-store'
import { PACKAGE } from '../constants'
import {
	activeProjectIsBlueprintFormat,
	type IBlueprintInteractionConfigJSON,
} from '../formats/blueprint'
import EVENTS from '../util/events'
import { localize as translate } from '../util/lang'
import { DeepClonedObjectProperty, fixClassPropertyInheritance } from '../util/property'
import { ResizableOutlinerElement } from './resizableOutlinerElement'
import { sanitizeOutlinerElementName } from './util'

interface InteractionOptions {
	name?: string
	block?: string
	position?: ArrayVector3
	rotation?: ArrayVector3
	scale?: ArrayVector3
	visibility?: boolean
	color?: number
}

@fixClassPropertyInheritance
export class Interaction extends ResizableOutlinerElement {
	static type = `${PACKAGE.name}:interaction`
	static icon = 'fa-computer-mouse'
	static selected: Interaction[] = []
	static all: Interaction[] = []

	static behavior = {
		select_faces: false,
		cube_faces: false,
		movable: true,
		resizable: true,
		rotatable: false,
		unique_name: true,
	}

	type = Interaction.type
	icon = Interaction.icon
	needsUniqueName = true

	// Properties
	onSummonFunction = Interaction.properties.onSummonFunction.default as string
	config!: IBlueprintInteractionConfigJSON

	error = observable('')

	buttons = [Outliner.buttons.export, Outliner.buttons.locked, Outliner.buttons.visibility]
	// eslint-disable-next-line @typescript-eslint/naming-convention
	preview_controller = PREVIEW_CONTROLLER

	constructor(data: InteractionOptions, uuid = guid()) {
		super(data, uuid)
		Interaction.all.push(this)

		for (const key in Interaction.properties) {
			Interaction.properties[key].reset(this)
		}

		this.name = 'interaction'
		this.extend(data)

		this.sanitizeName()
	}

	sanitizeName(): string {
		this.name = sanitizeOutlinerElementName(this.name, this.uuid)
		return this.name
	}

	getUndoCopy() {
		const copy = {} as InteractionOptions & { uuid: string; type: string }

		for (const key in Interaction.properties) {
			Interaction.properties[key].copy(this, copy)
		}

		copy.uuid = this.uuid
		copy.type = this.type
		return copy
	}

	getSaveCopy() {
		const save = super.getSaveCopy?.() ?? {}
		for (const key in Interaction.properties) {
			Interaction.properties[key].copy(this, save)
		}
		return save
	}

	resize(
		val: number | ((n: number) => number),
		axis: number,
		negative: boolean,
		_allowNegative: boolean,
		_bidirectional: boolean
	) {
		let before = this.temp_data.old_size ?? this.size(axis)
		if (Array.isArray(before)) before = before[axis]

		let beforeOrigin = this.temp_data.old_origin ?? this.origin
		if (Array.isArray(beforeOrigin)) beforeOrigin = beforeOrigin[axis]

		// For some unknown reason scale is not inverted on the y axis
		let sign = before < 0 && axis !== 1 ? -1 : 1
		if (negative) sign *= -1

		const modify = typeof val === 'function' ? val : (n: number) => n + val * sign

		let value = modify(before)

		value = Math.max(value, 0)

		if (axis === 1) {
			this.scale[axis] = value
		} else {
			this.scale[0] = value
			this.scale[2] = value
		}

		this.preview_controller.updateGeometry?.(this)
		this.preview_controller.updateTransform(this)

		return this
	}

	select() {
		if (Group.first_selected) {
			Group.first_selected.unselect()
		}
		if (!Pressing.ctrl && !Pressing.shift) {
			if (Cube.selected.length) {
				Cube.selected.forEachReverse(el => el.unselect())
			}
			if (selected.length) {
				selected.forEachReverse(el => el !== this && el.unselect())
			}
		}

		Interaction.selected.safePush(this)
		this.selectLow()
		this.showInOutliner()
		updateSelection()
		if (Animator.open && Blockbench.Animation.selected) {
			Blockbench.Animation.selected.getBoneAnimator(this).select()
		}
		return this
	}

	unselect(_unselectParent?: boolean) {
		if (!this.selected) return this
		if (
			Animator.open &&
			Timeline.selected_animator &&
			Timeline.selected_animator.element === this &&
			Timeline.selected
		) {
			Timeline.selected.empty()
		}
		Project!.selected_elements.remove(this)
		Interaction.selected.remove(this)
		this.selected = false
		TickUpdates.selection = true
		this.preview_controller.updateHighlight(this)
		return this
	}
}
Interaction.prototype.icon = Interaction.icon
new Property(Interaction, 'string', 'onSummonFunction', { default: '' })
new DeepClonedObjectProperty(Interaction, 'config', {
	default: () => ({ tints: [] }),
})
OutlinerElement.registerType(Interaction, Interaction.type)

interface MaterialSet {
	default: THREE.LineBasicMaterial
	selected: THREE.LineBasicMaterial
}
const MATERIALS: Record<number, MaterialSet> = {}
function getBoundingBoxMaterial(interaction: Interaction): MaterialSet {
	if (!MATERIALS[interaction.color]) {
		const markerColor = markerColors[interaction.color % markerColors.length]
		MATERIALS[interaction.color] = {
			default: new THREE.LineBasicMaterial({
				color: new THREE.Color().set(markerColor.standard),
			}),
			selected: new THREE.LineBasicMaterial({
				color: new THREE.Color().set(markerColor.pastel),
			}),
		}
	}
	return MATERIALS[interaction.color]
}

export const PREVIEW_CONTROLLER: NodePreviewController = new NodePreviewController(Interaction, {
	setup(el: Interaction) {
		ResizableOutlinerElement.prototype.preview_controller.setup(el)

		const mesh = new THREE.LineSegments(
			new THREE.BufferGeometry(),
			getBoundingBoxMaterial(el).default
		)
		mesh.name = el.uuid
		mesh.type = Interaction.type
		mesh.no_export = true
		mesh.visible = el.visibility
		mesh.renderOrder = 100

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
	updateGeometry(el: Interaction) {
		if (!el.mesh) return
		const mesh = el.mesh as THREE.LineSegments
		// Create a box geometry with the size of 1, centered horizontally and aligned to the bottom
		const geometry = new THREE.BoxGeometry(1, 1, 1)
		geometry.translate(0, 0.5, 0)
		const edges = new THREE.EdgesGeometry(geometry)
		mesh.geometry.dispose()
		mesh.geometry = edges

		mesh.geometry.computeBoundingBox()
		mesh.geometry.computeBoundingSphere()

		const materialSet = getBoundingBoxMaterial(el)
		mesh.material = el.selected ? materialSet.selected : materialSet.default

		this.dispatchEvent('update_geometry', { element: el })
	},
	updateTransform(el: Interaction) {
		ResizableOutlinerElement.prototype.preview_controller.updateTransform(el)
		if (el.mesh.parent) {
			console.log('Updating interaction transform with parent')
			Reusable.euler1.setFromQuaternion(
				el.mesh.parent.getWorldQuaternion(Reusable.quat1),
				'ZYX'
			)
			el.mesh.rotation.x = -Reusable.euler1.x
			el.mesh.rotation.y = -Reusable.euler1.y
			el.mesh.rotation.z = -Reusable.euler1.z
			el.mesh.fix_rotation!.copy(el.mesh.rotation)
		}
	},
	updateHighlight(el: Interaction, force?: boolean | Interaction) {
		if (!activeProjectIsBlueprintFormat() || !el?.mesh) return
		const highlighted = Modes.edit && (force === true || force === el || el.selected) ? 1 : 0

		const blockModel = el.mesh.children.at(0) as THREE.Mesh
		if (!blockModel) return
		for (const child of blockModel.children) {
			if (!(child instanceof THREE.Mesh)) continue
			const highlight = child.geometry.attributes.highlight

			if (highlight.array[0] != highlighted) {
				highlight.array.set(Array(highlight.count).fill(highlighted))
				highlight.needsUpdate = true
			}
		}
	},
})

class InteractionAnimator extends BoneAnimator {
	uuid: string
	element: Interaction | undefined

	constructor(uuid: string, animation: _Animation, name: string) {
		super(uuid, animation, name)
		this.uuid = uuid
	}

	getElement() {
		this.element = OutlinerNode.uuids[this.uuid] as Interaction
		return this.element
	}

	select() {
		this.getElement()
		if (!this.element) {
			unselectAllElements()
			return this
		}

		if (this.element.locked) {
			return this
		}

		if (!this.element.selected && this.element) {
			this.element.select()
		}
		GeneralAnimator.prototype.select.call(this)

		if (
			// @ts-expect-error - Broken BB types
			this[Toolbox.selected.animation_channel] &&
			((Timeline.selected && Timeline.selected.length === 0) ||
				(Timeline.selected && (Timeline.selected[0].animator as any)) !== this)
		) {
			let nearest: _Keyframe | undefined
			// @ts-expect-error - Broken BB types
			this[Toolbox.selected.animation_channel].forEach((kf: _Keyframe) => {
				if (Math.abs(kf.time - Timeline.time) < 0.002) {
					nearest = kf
				}
			})
			if (nearest) {
				nearest.select()
			}
		}

		if (this.element?.parent && this.element.parent !== 'root') {
			this.element.parent.openUp()
		}

		return this
	}

	doRender() {
		this.getElement()
		return !!this.element?.mesh
	}

	displayRotation(arr: ArrayVector3 | ArrayVector4, multiplier = 1) {
		const bone = this.getElement().mesh

		if (bone.parent) {
			Reusable.euler1.setFromQuaternion(bone.parent.getWorldQuaternion(Reusable.quat1), 'ZYX')
			bone.rotation.x = -Reusable.euler1.x
			bone.rotation.y = -Reusable.euler1.y
			bone.rotation.z = -Reusable.euler1.z
			return
		}

		bone.rotation.x = 0
		bone.rotation.y = 0
		bone.rotation.z = 0

		return this
	}

	displayPosition(arr: ArrayVector3, multiplier = 1) {
		const bone = this.getElement().mesh
		if (bone.fix_position) {
			bone.position.copy(bone.fix_position as THREE.Vector3)
		}
		if (arr) {
			bone.position.x += arr[0] * multiplier
			bone.position.y += arr[1] * multiplier
			bone.position.z += arr[2] * multiplier
		}
		return this
	}

	displayScale() {
		const el = this.getElement()

		if (el.mesh.parent) {
			// prevent parent scale from affecting the size of the element
			Reusable.vec3.copy(el.mesh.parent.scale)
			el.mesh.scale.set(...el.scale).divide(Reusable.vec3)
			el.mesh.fix_scale!.copy(el.mesh.scale)
			return this
		}

		el.mesh.scale.set(...el.scale)

		return this
	}
}
InteractionAnimator.prototype.type = Interaction.type
Interaction.animator = InteractionAnimator as any
InteractionAnimator.prototype.channels = {
	position: InteractionAnimator.prototype.channels.position,
	function: {
		name: translate('effect_animator.timeline.function'),
		mutable: true,
		transform: true,
		max_data_points: 1,
	},
}

export const CREATE_ACTION = registerDeletableHandlerPatch({
	id: `animated_java:action/create-interaction`,
	create() {
		const action = new Blockbench.Action(`animated_java:action/create-interaction`, {
			name: translate('action.create_interaction.title'),
			icon: Interaction.icon,
			category: 'animated_java',
			condition() {
				return (
					activeProjectIsBlueprintFormat() && Mode.selected.id === Modes.options.edit.id
				)
			},
			click() {
				Undo.initEdit({ outliner: true, elements: [], selection: true })

				const interaction = new Interaction({}).init()
				const group = getCurrentGroup()

				if (group instanceof Group) {
					interaction.addTo(group)
					interaction.extend({ position: group.origin.slice() as ArrayVector3 })
				}

				selected.forEachReverse(el => el.unselect())
				Group.first_selected?.unselect()
				interaction.select()

				Undo.finishEdit('Create Interaction', {
					outliner: true,
					elements: selected,
					selection: true,
				})

				return interaction
			},
		})

		// @ts-expect-error - Broken BB types
		BarItems.add_element.side_menu.addAction(action, 3)

		return action
	},
})

registerPatch({
	id: `animated_java:interaction-project-sync`,

	apply: () => {
		const callbacks: Array<() => void> = []

		callbacks.push(
			EVENTS.SELECT_PROJECT.subscribe(project => {
				project.interactions ??= []
				Interaction.all.empty()
				Interaction.all.push(...project.interactions)
			}),

			EVENTS.UNSELECT_PROJECT.subscribe(project => {
				project.interactions = [...Interaction.all]
				Interaction.all.empty()
			})
		)
		return { callbacks }
	},

	revert: ({ callbacks }) => {
		// @ts-expect-error - Broken BB types
		BarItems.add_element.side_menu.removeAction(`animated_java:action/create-interaction`)

		callbacks.forEach(unsub => unsub())
	},
})
