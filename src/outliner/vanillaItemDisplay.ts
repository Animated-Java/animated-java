import { IBlueprintBoneConfigJSON, isCurrentFormat } from '../blueprintFormat'
import { PACKAGE } from '../constants'
import { VANILLA_ITEM_DISPLAY_CONFIG_ACTION } from '../interface/vanillaItemDisplayConfigDialog'
import { BoneConfig } from '../nodeConfigs'
import { getItemModel } from '../systems/minecraft/itemModelManager'
import { MINECRAFT_REGISTRY } from '../systems/minecraft/registryManager'
import { getCurrentVersion } from '../systems/minecraft/versionManager'
import { events } from '../util/events'
import { toSafeFuntionName } from '../util/minecraftUtil'
import { createAction, createBlockbenchMod } from '../util/moddingTools'
import { Valuable } from '../util/stores'
import { translate } from '../util/translation'

interface VanillaItemDisplayOptions {
	name?: string
	block?: string
	position?: ArrayVector3
	rotation?: ArrayVector3
	scale?: ArrayVector3
	visibility?: boolean
}

export class VanillaItemDisplay extends OutlinerElement {
	static type = `${PACKAGE.name}:vanilla_item_display`
	static selected: VanillaItemDisplay[] = []
	static all: VanillaItemDisplay[] = []

	public type = VanillaItemDisplay.type
	public icon = 'icecream'
	public movable = true
	public rotatable = true
	public scalable = true
	public needsUniqueName = true

	public resizable = true
	// Lame workaround variables to make the resize function work
	public stretch = [0, 0, 0]
	// eslint-disable-next-line @typescript-eslint/naming-convention
	public uv_offset = [0, 0]
	public from = [0, 0, 0]
	public to = [0, 0, 0]

	// Properties
	public name: string
	public _item = new Valuable('minecraft:diamond')
	public position: ArrayVector3
	public rotation: ArrayVector3
	public scale: ArrayVector3
	public visibility: boolean
	public config: IBlueprintBoneConfigJSON

	public error = new Valuable('')

	public menu = new Menu([
		...Outliner.control_menu_group,
		VANILLA_ITEM_DISPLAY_CONFIG_ACTION,
		'_',
		'rename',
		'delete',
	])
	public buttons = [Outliner.buttons.export, Outliner.buttons.locked, Outliner.buttons.visibility]
	// eslint-disable-next-line @typescript-eslint/naming-convention
	public preview_controller = PREVIEW_CONTROLLER

	constructor(data: VanillaItemDisplayOptions, uuid = guid()) {
		super(data, uuid)
		VanillaItemDisplay.all.push(this)

		for (const key in VanillaItemDisplay.properties) {
			VanillaItemDisplay.properties[key].reset(this)
		}

		this.extend(data)

		this.name ??= 'vanilla_item_display'
		this.item ??= 'minecraft:diamond'
		this.position ??= [0, 0, 0]
		this.rotation ??= [0, 0, 0]
		this.scale ??= [1, 1, 1]
		this.visibility ??= true
		this.config ??= {}

		this.sanitizeName()

		const updateItem = (newItem: string) => {
			if (!MINECRAFT_REGISTRY.item) {
				requestAnimationFrame(() => updateItem(newItem))
				return
			}
			const [namespace, id] = newItem.split(':')
			if (
				(namespace === 'minecraft' || namespace === '') &&
				MINECRAFT_REGISTRY.item.has(id)
			) {
				this.error.set('')
				this.preview_controller.updateGeometry(this)
			} else {
				this.error.set(`This item does not exist in Minecraft ${getCurrentVersion()!.id}.`)
			}
		}

		this._item.subscribe(value => {
			updateItem(value)
		})
	}

	get item() {
		return this._item.get()
	}
	set item(value: string) {
		this._item.set(value)
	}

	public extend(data: VanillaItemDisplayOptions) {
		for (const key in VanillaItemDisplay.properties) {
			VanillaItemDisplay.properties[key].merge(this, data)
		}
		if (data.visibility !== undefined) {
			this.visibility = data.visibility
		}

		return this
	}

	public sanitizeName(): string {
		this.name = toSafeFuntionName(this.name)
		if (!VanillaItemDisplay.all.some(v => v !== this && v.name === this.name)) {
			return this.name
		}

		let i = 1
		const match = this.name.match(/\d+$/)
		if (match) {
			i = parseInt(match[0])
			this.name = this.name.slice(0, -match[0].length)
		}

		let maxTries = 1000
		while (maxTries-- > 0) {
			const newName = `${this.name}${i}`
			if (!VanillaItemDisplay.all.some(v => v !== this && v.name === newName)) {
				return newName
			}
			i++
		}

		throw new Error('Could not make VanillaItemDisplay name unique!')
	}

	get origin(): ArrayVector3 {
		return this.position
	}

	getWorldCenter(): THREE.Vector3 {
		Reusable.vec3.set(0, 0, 0)
		// @ts-ignore
		// eslint-disable-next-line @typescript-eslint/no-unsafe-return
		return THREE.fastWorldPosition(this.mesh, Reusable.vec2).add(Reusable.vec3)
	}

	getUndoCopy() {
		const copy = new VanillaItemDisplay(this)

		for (const key in VanillaItemDisplay.properties) {
			VanillaItemDisplay.properties[key].copy(this, copy)
		}

		copy.uuid = this.uuid
		copy.type = this.type
		delete copy.parent
		return copy
	}

	getSaveCopy() {
		const el: any = {}
		for (const key in VanillaItemDisplay.properties) {
			VanillaItemDisplay.properties[key].copy(this, el)
		}
		el.uuid = this.uuid
		el.type = this.type
		// eslint-disable-next-line @typescript-eslint/no-unsafe-return
		return el
	}

	select() {
		if (Group.selected) {
			Group.selected.unselect()
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

	selectLow() {
		Project!.selected_elements.safePush(this)
		this.selected = true
		TickUpdates.selection = true
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

	size(axis?: number, floored?: boolean) {
		if (axis === undefined) {
			return this.scale
		}
		return this.scale[axis]
	}

	private oldScale: ArrayVector3 | undefined
	resize(
		val: number | ((n: number) => number),
		axis: number,
		negative: boolean,
		allowNegative: boolean,
		bidirectional: boolean
	) {
		console.log('resize', val, axis, negative, allowNegative, bidirectional)
		let before = this.oldScale != undefined ? this.oldScale : this.size(axis)
		if (before instanceof Array) before = before[axis]
		// const isInverted = before < 0
		// if (isInverted) negative = !negative
		const modify = val instanceof Function ? val : (n: number) => n + val

		this.scale[axis] = modify(before)
		console.log('resize', before, this.scale)
		// if (negative) {
		// 	this.scale[axis] = modify(-before)
		// } else {
		// 	this.scale[axis] = modify(before)
		// }

		this.preview_controller.updateGeometry(this)
	}
}
new Property(VanillaItemDisplay, 'string', 'name', { default: 'vanilla_item_display' })
new Property(VanillaItemDisplay, 'string', 'item', { default: 'minecraft:diamond' })
new Property(VanillaItemDisplay, 'vector', 'position', { default: [0, 0, 0] })
new Property(VanillaItemDisplay, 'vector', 'rotation', { default: [0, 0, 0] })
new Property(VanillaItemDisplay, 'vector', 'scale', { default: [1, 1, 1] })
new Property(VanillaItemDisplay, 'string', 'visibility', { default: true })
new Property(VanillaItemDisplay, 'object', 'config', {
	get default() {
		return new BoneConfig().toJSON()
	},
})
OutlinerElement.registerType(VanillaItemDisplay, VanillaItemDisplay.type)

export const PREVIEW_CONTROLLER = new NodePreviewController(VanillaItemDisplay, {
	setup(el: VanillaItemDisplay) {
		const mesh = new THREE.Mesh()
		mesh.fix_rotation = new THREE.Euler(0, 0, 0, 'ZYX')
		mesh.fix_rotation.x = Math.degToRad(el.rotation[0])
		mesh.fix_rotation.y = Math.degToRad(el.rotation[1])
		mesh.fix_rotation.z = Math.degToRad(el.rotation[2])
		mesh.fix_position = new THREE.Vector3(...el.position)
		// mesh.fix_scale = new THREE.Vector3(...el.scale)
		Project!.nodes_3d[el.uuid] = mesh

		PREVIEW_CONTROLLER.updateTransform(el)
		PREVIEW_CONTROLLER.updateGeometry(el)
		PREVIEW_CONTROLLER.dispatchEvent('setup', { element: el })
	},
	updateGeometry(el: VanillaItemDisplay) {
		if (!el.mesh) return
		console.log('updateGeometry', el)
		// el.mesh.scale.set(...el.scale)
		void getItemModel(el.item)
			.then(mesh => {
				if (!mesh) return

				mesh.geometry.scale(...el.scale)
				el.mesh.clear()
				el.mesh.add(mesh)

				PREVIEW_CONTROLLER.updateHighlight(el)
				PREVIEW_CONTROLLER.updateTransform(el)
				el.mesh.visible = el.visibility
				TickUpdates.selection = true
			})
			.catch(err => {
				if (typeof err.message === 'string') {
					el.error.set(err.message as string)
				}
			})
	},
	updateTransform(el: VanillaItemDisplay) {
		const mesh = el.mesh

		mesh.position.set(el.origin[0], el.origin[1], el.origin[2])

		mesh.rotation.x = Math.degToRad(el.rotation[0])
		mesh.rotation.y = Math.degToRad(el.rotation[1])
		mesh.rotation.z = Math.degToRad(el.rotation[2])

		mesh.scale.x = el.scale[0] || 1e-7
		mesh.scale.y = el.scale[1] || 1e-7
		mesh.scale.z = el.scale[2] || 1e-7

		if (Format.bone_rig) {
			if (el.parent instanceof Group) {
				el.parent.mesh.add(mesh)
				mesh.position.x -= el.parent.origin[0]
				mesh.position.y -= el.parent.origin[1]
				mesh.position.z -= el.parent.origin[2]
			} else if (mesh.parent !== Project!.model_3d) {
				Project!.model_3d.add(mesh)
			}
		} else if (mesh.parent !== Project!.model_3d) {
			Project!.model_3d.add(mesh)
		}

		mesh.updateMatrixWorld()

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
		// const itemModel = el.mesh.children.at(0) as THREE.Mesh
		// if (itemModel) {
		// 	itemModel.geometry.scale(...el.scale)
		// 	itemModel.geometry.scale(...el.scale)
		// }
		// if (el.mesh.fix_scale) {
		// 	el.mesh.fix_scale.set(...el.scale)
		// }
	},
	updateHighlight(element: VanillaItemDisplay, force?: boolean | VanillaItemDisplay) {
		if (!isCurrentFormat() || !element?.mesh) return

		const vanillaItemMesh = element.mesh.children.at(0) as THREE.Mesh
		if (!vanillaItemMesh?.isVanillaItemModel) return
		const highlight = vanillaItemMesh.geometry.attributes.highlight
		const highlighted =
			Modes.edit && (force === true || force === element || element.selected) ? 1 : 0

		if (highlight.array[0] != highlighted) {
			// @ts-ignore
			highlight.array.set(Array(highlight.count).fill(highlighted))
			highlight.needsUpdate = true
		}
	},
})

export const CREATE_ACTION = createAction(`${PACKAGE.name}:create_vanilla_item_display`, {
	name: translate('action.create_vanilla_item_display.title'),
	icon: 'icecream',
	category: 'animated_java',
	condition() {
		return isCurrentFormat() && Mode.selected.id === Modes.options.edit.id
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
		Group.selected && Group.selected.unselect()
		vanillaItemDisplay.select()

		Undo.finishEdit('Create Vanilla Item Display', {
			outliner: true,
			elements: selected,
			selection: true,
		})

		return vanillaItemDisplay
	},
})

class VanillaItemDisplayAnimator extends BoneAnimator {
	private _name: string

	public uuid: string
	public element: VanillaItemDisplay | undefined

	constructor(uuid: string, animation: _Animation, name: string) {
		super(uuid, animation, name)
		this.uuid = uuid
		this._name = name
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

		if (this.element && this.element.parent && this.element.parent !== 'root') {
			this.element.parent.openUp()
		}

		return this
	}

	doRender() {
		this.getElement()
		return !!(this.element && this.element.mesh)
	}

	displayRotation(arr: ArrayVector3 | ArrayVector4, multiplier = 1) {
		const bone = this.getElement().mesh

		if (bone.fix_rotation) {
			bone.rotation.x = Math.degToRad(bone.fix_rotation.x as number)
			bone.rotation.y = Math.degToRad(bone.fix_rotation.y as number)
			bone.rotation.z = Math.degToRad(bone.fix_rotation.z as number)
			console.log(
				'fix_rotation',
				this.element!.name,
				bone.fix_rotation.toArray(),
				bone.rotation.toArray(),
				arr
			)
		}

		if (arr) {
			if (arr.length === 4) {
				const added_rotation = new THREE.Euler().setFromQuaternion(
					new THREE.Quaternion().fromArray(arr),
					'ZYX'
				)
				bone.rotation.x -= added_rotation.x * multiplier
				bone.rotation.y -= added_rotation.y * multiplier
				bone.rotation.z += added_rotation.z * multiplier
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
		// if (bone.fix_scale) {
		// 	bone.scale.copy(bone.fix_scale)
		// }
		bone.scale.x = 1 + (arr[0] - 1) * multiplier || 0.00001
		bone.scale.y = 1 + (arr[1] - 1) * multiplier || 0.00001
		bone.scale.z = 1 + (arr[2] - 1) * multiplier || 0.00001
		return this
	}
}
VanillaItemDisplayAnimator.prototype.type = VanillaItemDisplay.type
VanillaItemDisplay.animator = VanillaItemDisplayAnimator as any

createBlockbenchMod(
	`${PACKAGE.name}:vanillaItemDisplay`,
	{
		subscriptions: [] as Array<() => void>,
	},
	context => {
		Interface.Panels.outliner.menu.addAction(CREATE_ACTION, 3)
		Toolbars.outliner.add(CREATE_ACTION, 0)
		MenuBar.menus.edit.addAction(CREATE_ACTION, 8)

		context.subscriptions.push(
			events.SELECT_PROJECT.subscribe(project => {
				project.vanillaItemDisplays ??= []
				VanillaItemDisplay.all.empty()
				VanillaItemDisplay.all.push(...project.vanillaItemDisplays)
			}),
			events.UNSELECT_PROJECT.subscribe(project => {
				project.vanillaItemDisplays = [...VanillaItemDisplay.all]
				VanillaItemDisplay.all.empty()
			})
		)
		return context
	},
	context => {
		Interface.Panels.outliner.menu.removeAction(CREATE_ACTION.id)
		Toolbars.outliner.remove(CREATE_ACTION)
		MenuBar.menus.edit.removeAction(CREATE_ACTION.id)

		context.subscriptions.forEach(unsub => unsub())
	}
)
