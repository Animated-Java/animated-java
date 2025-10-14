import { getItemModel } from 'src/systems/minecraft/itemModelManager'
import { IDisplayEntityConfigs } from 'src/systems/rigRenderer'
import { validateItem } from 'src/util/minecraftUtil'
import { registerAction } from 'src/util/moddingTools'
import { DeepClonedObjectProperty, fixClassPropertyInheritance } from 'src/util/property'
import { PACKAGE } from '../constants'
import { activeProjectIsBlueprintFormat } from '../formats/blueprint'
import EVENTS from '../util/events'
import { Valuable } from '../util/stores'
import { translate } from '../util/translation'
import { ResizableOutlinerElement } from './resizableOutlinerElement'
import { sanitizeOutlinerElementName } from './util'

export type ItemDisplayMode =
	| 'none'
	| 'thirdperson_lefthand'
	| 'thirdperson_righthand'
	| 'firstperson_lefthand'
	| 'firstperson_righthand'
	| 'head'
	| 'gui'
	| 'ground'
	| 'fixed'

interface VanillaItemDisplayOptions {
	name?: string
	item?: string
	itemDisplay?: ItemDisplayMode
	position?: ArrayVector3
	rotation?: ArrayVector3
	scale?: ArrayVector3
	visibility?: boolean
}

@fixClassPropertyInheritance
export class VanillaItemDisplay extends ResizableOutlinerElement {
	static type = `${PACKAGE.name}:vanilla_item_display`
	static icon = 'icecream'
	static selected: VanillaItemDisplay[] = []
	static all: VanillaItemDisplay[] = []

	type = VanillaItemDisplay.type
	icon = VanillaItemDisplay.icon
	needsUniqueName = true

	// Properties
	private __item = new Valuable('minecraft:diamond')
	private __itemDisplay = new Valuable<ItemDisplayMode>('none')
	onSummonFunction = VanillaItemDisplay.properties.onSummonFunction.default as string
	configs!: IDisplayEntityConfigs

	error = new Valuable('')

	buttons = [Outliner.buttons.export, Outliner.buttons.locked, Outliner.buttons.visibility]
	// eslint-disable-next-line @typescript-eslint/naming-convention
	preview_controller = PREVIEW_CONTROLLER

	constructor(data: VanillaItemDisplayOptions, uuid = guid()) {
		super(data, uuid)
		VanillaItemDisplay.all.push(this)

		for (const key in VanillaItemDisplay.properties) {
			VanillaItemDisplay.properties[key].reset(this)
		}

		this.name = 'item_display'
		this.extend(data)

		this.sanitizeName()

		this.__item.subscribe(() => {
			void this.updateItem()
		})
	}

	get item() {
		if (this.__item === undefined) return 'minecraft:diamond'
		return this.__item.get()
	}
	set item(value: string) {
		if (this.__item === undefined) return
		this.__item.set(value)
	}

	get itemDisplay() {
		if (this.__itemDisplay === undefined) return 'none'
		return this.__itemDisplay.get()
	}
	set itemDisplay(value: ItemDisplayMode) {
		if (this.__itemDisplay === undefined) return
		this.__itemDisplay.set(value)
	}

	sanitizeName(): string {
		this.name = sanitizeOutlinerElementName(this.name, this.uuid)
		return this.name
	}

	getUndoCopy() {
		const copy = {} as VanillaItemDisplayOptions & { uuid: string; type: string }

		for (const key in VanillaItemDisplay.properties) {
			VanillaItemDisplay.properties[key].copy(this, copy)
		}

		copy.uuid = this.uuid
		copy.type = this.type
		return copy
	}

	getSaveCopy() {
		const save = super.getSaveCopy?.() ?? {}
		for (const key in VanillaItemDisplay.properties) {
			VanillaItemDisplay.properties[key].copy(this, save)
		}
		return save
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

		VanillaItemDisplay.selected.safePush(this)
		this.selectLow()
		this.showInOutliner()
		updateSelection()
		if (Animator.open && Blockbench.Animation.selected) {
			Blockbench.Animation.selected.getBoneAnimator(this).select()
		}
		return this
	}

	unselect() {
		if (!this.selected) return
		if (
			Animator.open &&
			Timeline.selected_animator &&
			Timeline.selected_animator.element === this &&
			Timeline.selected
		) {
			Timeline.selected.empty()
		}
		Project!.selected_elements.remove(this)
		VanillaItemDisplay.selected.remove(this)
		this.selected = false
		TickUpdates.selection = true
		this.preview_controller.updateHighlight(this)
	}

	async updateItem() {
		const error = await validateItem(this.item)
		if (error) {
			this.error.set(error)
			return
		}
		this.error.set('')
		this.preview_controller.updateGeometry(this)
	}
}
VanillaItemDisplay.prototype.icon = VanillaItemDisplay.icon
new Property(VanillaItemDisplay, 'string', 'item', { default: 'minecraft:diamond' })
new Property(VanillaItemDisplay, 'string', 'itemDisplay', { default: 'none' })
new Property(VanillaItemDisplay, 'string', 'onSummonFunction', { default: '' })
new DeepClonedObjectProperty(VanillaItemDisplay, 'configs', {
	default: () => ({ default: {}, variants: {} }),
})
OutlinerElement.registerType(VanillaItemDisplay, VanillaItemDisplay.type)

const TEMP_MESH_MAP = new THREE.TextureLoader().load(
	'data:image/svg+xml,' +
		encodeURIComponent(
			`<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e3e3e3"><path d="M482-40 294-400q-71 3-122.5-41T120-560q0-51 29.5-92t74.5-58q18-91 89.5-150.5T480-920q95 0 166.5 59.5T736-710q45 17 74.5 58t29.5 92q0 75-53 119t-119 41L482-40ZM280-480q15 0 29.5-5t26.5-17l22-22 26 16q21 14 45.5 21t50.5 7q26 0 50.5-7t45.5-21l26-16 22 22q12 12 26.5 17t29.5 5q33 0 56.5-23.5T760-560q0-30-19-52.5T692-640l-30-4-2-32q-5-69-57-116.5T480-840q-71 0-123 47.5T300-676l-2 32-30 6q-30 6-49 27t-19 51q0 33 23.5 56.5T280-480Zm202 266 108-210q-24 12-52 18t-58 6q-27 0-54.5-6T372-424l110 210Zm-2-446Z"/></svg>`
		)
)
TEMP_MESH_MAP.minFilter = THREE.NearestFilter
TEMP_MESH_MAP.magFilter = THREE.NearestFilter

export const PREVIEW_CONTROLLER = new NodePreviewController(VanillaItemDisplay, {
	setup(el: VanillaItemDisplay) {
		ResizableOutlinerElement.prototype.preview_controller.setup(el)
		// Setup temp sprite mesh
		const material = new THREE.SpriteMaterial({
			map: TEMP_MESH_MAP,
			alphaTest: 0.1,
			sizeAttenuation: false,
		})
		const sprite = new THREE.Sprite(material)
		sprite.scale.setScalar(1 / 20)
		const mesh = el.mesh as THREE.Mesh
		mesh.add(sprite)
		mesh.sprite = sprite
	},
	updateGeometry(el: VanillaItemDisplay) {
		if (!el.mesh) return

		void getItemModel(el.item)
			.then(result => {
				if (!result) return
				const mesh = el.mesh as THREE.Mesh
				mesh.name = el.uuid
				mesh.geometry = result.boundingBox
				mesh.material = Canvas.transparentMaterial
				mesh.clear()
				mesh.add(result.mesh)
				mesh.add(result.outline)
				mesh.outline = result.outline

				el.preview_controller.updateHighlight(el)
				el.preview_controller.updateTransform(el)
				mesh.visible = el.visibility
				TickUpdates.selection = true
			})
			.catch(err => {
				if (typeof err.message === 'string') {
					el.error.set(err.message as string)
				}
			})
	},
	updateTransform(el: VanillaItemDisplay) {
		ResizableOutlinerElement.prototype.preview_controller.updateTransform(el)
	},
	updateHighlight(el: VanillaItemDisplay, force?: boolean | VanillaItemDisplay) {
		if (!activeProjectIsBlueprintFormat() || !el?.mesh) return
		const highlighted = Modes.edit && (force === true || force === el || el.selected) ? 1 : 0

		const itemModel = el.mesh.children.at(0) as THREE.Mesh
		if (!itemModel) return
		for (const child of itemModel.children) {
			if (!(child instanceof THREE.Mesh)) continue
			const highlight = child.geometry.attributes.highlight

			if (highlight.array[0] != highlighted) {
				highlight.array.set(Array(highlight.count).fill(highlighted))
				highlight.needsUpdate = true
			}
		}
	},
})

class VanillaItemDisplayAnimator extends BoneAnimator {
	uuid: string
	element: VanillaItemDisplay | undefined

	constructor(uuid: string, animation: _Animation, name: string) {
		super(uuid, animation, name)
		this.uuid = uuid
	}

	getElement() {
		this.element = OutlinerNode.uuids[this.uuid] as VanillaItemDisplay
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
			this[Toolbox.selected.animation_channel] &&
			((Timeline.selected && Timeline.selected.length === 0) ||
				(Timeline.selected && (Timeline.selected[0].animator as any)) !== this)
		) {
			let nearest: _Keyframe | undefined
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

		if (bone.fix_rotation) {
			bone.rotation.copy(bone.fix_rotation as THREE.Euler)
		}

		if (arr) {
			if (arr.length === 4) {
				const addedRotation = new THREE.Euler().setFromQuaternion(
					new THREE.Quaternion().fromArray(arr),
					'ZYX'
				)
				bone.rotation.x -= addedRotation.x * multiplier
				bone.rotation.y -= addedRotation.y * multiplier
				bone.rotation.z += addedRotation.z * multiplier
			} else {
				bone.rotation.x += Math.degToRad(-arr[0]) * multiplier
				bone.rotation.y += Math.degToRad(-arr[1]) * multiplier
				bone.rotation.z += Math.degToRad(arr[2]) * multiplier
			}
		}
		if (this.rotation_global) {
			const quat = bone.parent?.getWorldQuaternion(Reusable.quat1)
			if (!quat) return this
			quat.invert()
			bone.quaternion.premultiply(quat)
		}
		return this
	}

	displayPosition(arr: ArrayVector3, multiplier = 1) {
		const bone = this.getElement().mesh
		if (bone.fix_position) {
			bone.position.copy(bone.fix_position as THREE.Vector3)
		}
		if (arr) {
			bone.position.x -= arr[0] * multiplier
			bone.position.y += arr[1] * multiplier
			bone.position.z += arr[2] * multiplier
		}
		return this
	}

	displayScale(arr: ArrayVector3, multiplier = 1) {
		if (!arr) return this
		const bone = this.getElement().mesh
		if (bone.fix_scale) {
			bone.scale.copy(bone.fix_scale)
		}
		bone.scale.x = 1 + (arr[0] - 1) * multiplier || 0.00001
		bone.scale.y = 1 + (arr[1] - 1) * multiplier || 0.00001
		bone.scale.z = 1 + (arr[2] - 1) * multiplier || 0.00001
		return this
	}
}
VanillaItemDisplayAnimator.prototype.type = VanillaItemDisplay.type
VanillaItemDisplay.animator = VanillaItemDisplayAnimator as any

export const CREATE_ACTION = registerAction(
	{ id: `animated-java:action/create-vanilla-item-display` },
	{
		name: translate('action.create_vanilla_item_display.title'),
		icon: 'icecream',
		category: 'animated_java',
		condition() {
			return activeProjectIsBlueprintFormat() && Mode.selected.id === Modes.options.edit.id
		},
		click() {
			Undo.initEdit({ outliner: true, elements: [], selection: true })

			const vanillaItemDisplay = new VanillaItemDisplay({}).init()
			const group = getCurrentGroup()

			if (group instanceof Group) {
				vanillaItemDisplay.addTo(group)
				vanillaItemDisplay.extend({ position: group.origin.slice() as ArrayVector3 })
			}

			selected.forEachReverse(el => el.unselect())
			Group.first_selected?.unselect()
			vanillaItemDisplay.select()

			Undo.finishEdit('Create Vanilla Item Display', {
				outliner: true,
				elements: selected,
				selection: true,
			})

			return vanillaItemDisplay
		},
	}
)

const CLEANUP_CALLBACKS: Array<() => void> = []

CREATE_ACTION.onCreated(action => {
	Interface.Panels.outliner.menu.addAction(action, 3)
	Toolbars.outliner.add(action, 0)
	MenuBar.menus.edit.addAction(action, 8)

	CLEANUP_CALLBACKS.push(
		EVENTS.SELECT_PROJECT.subscribe(project => {
			project.vanillaItemDisplays ??= []
			VanillaItemDisplay.all.empty()
			VanillaItemDisplay.all.push(...project.vanillaItemDisplays)
		}),

		EVENTS.UNSELECT_PROJECT.subscribe(project => {
			project.vanillaItemDisplays = [...VanillaItemDisplay.all]
			VanillaItemDisplay.all.empty()
		})
	)
})

CREATE_ACTION.onDeleted(action => {
	Interface.Panels.outliner.menu.removeAction(action)
	Toolbars.outliner.remove(action)
	MenuBar.menus.edit.removeAction(action)

	CLEANUP_CALLBACKS.forEach(unsub => unsub())
	CLEANUP_CALLBACKS.empty()
})
