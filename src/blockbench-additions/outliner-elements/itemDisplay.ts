import { getItemModel } from '@aj/systems/minecraft-temp/itemModelManager'
import { MINECRAFT_REGISTRY } from '@aj/systems/minecraft-temp/registryManager'
import { getCurrentVersion } from '@aj/systems/minecraft-temp/versionManager'
import { CommonDisplayConfig, ItemDisplayConfig, type Serialized } from '@aj/systems/node-configs'
import EVENTS from '@events'
import { PACKAGE } from '../../constants'
import { VANILLA_ITEM_DISPLAY_CONFIG_ACTION } from '../../ui/dialogs/item-display-config'
import {
	createAction,
	createBlockbenchMod,
	fixClassPropertyInheritance,
} from '../../util/moddingTools'
import { Valuable } from '../../util/stores'
import { translate } from '../../util/translation'
import { isCurrentFormat } from '../model-formats/ajblueprint'
import { ResizableOutlinerElement } from './resizableOutlinerElement'
import { sanitizeOutlinerElementName } from './util'

interface ItemDisplayOptions {
	name?: string
	item?: string
	item_display?: string
	position?: ArrayVector3
	rotation?: ArrayVector3
	scale?: ArrayVector3
	visibility?: boolean
}

@fixClassPropertyInheritance
export class ItemDisplay extends ResizableOutlinerElement {
	static type = `${PACKAGE.name}:item_display`
	static selected: ItemDisplay[] = []
	static all: ItemDisplay[] = []

	public type = ItemDisplay.type
	public icon = 'icecream'
	public needsUniqueName = true

	// Properties
	private __item = new Valuable('minecraft:diamond')
	private __itemDisplay = new Valuable('none')
	public config: Serialized<ItemDisplayConfig>
	public commonConfig: Serialized<CommonDisplayConfig>

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

	public ready = false

	constructor(data: ItemDisplayOptions, uuid = guid()) {
		super(data, uuid)
		ItemDisplay.all.push(this)

		for (const key in ItemDisplay.properties) {
			ItemDisplay.properties[key].reset(this)
		}

		this.name = 'item_display'
		this.extend(data)

		this.item ??= 'minecraft:diamond'
		this.itemDisplay ??= 'none'
		this.position ??= [0, 0, 0]
		this.rotation ??= [0, 0, 0]
		this.scale ??= [1, 1, 1]
		this.visibility ??= true
		this.config ??= {}
		this.commonConfig ??= {}

		this.sanitizeName()

		const updateItem = (newItem: string) => {
			if (!MINECRAFT_REGISTRY.item) {
				requestAnimationFrame(() => updateItem(newItem))
				return
			}
			let [namespace, id] = newItem.split(':')
			if (!id) {
				id = namespace
				namespace = 'minecraft'
			}
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

		this.__item.subscribe(value => {
			updateItem(value)
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
	set itemDisplay(value: string) {
		if (this.__itemDisplay === undefined) return
		this.__itemDisplay.set(value)
	}

	async waitForReady() {
		while (!this.ready) {
			await new Promise(resolve => requestAnimationFrame(resolve))
		}
	}

	public sanitizeName(): string {
		this.name = sanitizeOutlinerElementName(this.name, this.uuid)
		return this.name
	}

	getUndoCopy() {
		const copy = {} as ItemDisplayOptions & { uuid: string; type: string }

		for (const key in ItemDisplay.properties) {
			ItemDisplay.properties[key].copy(this, copy)
		}

		copy.uuid = this.uuid
		copy.type = this.type
		return copy
	}

	getSaveCopy() {
		const el: any = {}
		for (const key in ItemDisplay.properties) {
			ItemDisplay.properties[key].copy(this, el)
		}
		el.uuid = this.uuid
		el.type = this.type
		return el
	}

	select() {
		Group.all.forEachReverse(el => el.unselect())

		if (!Pressing.ctrl && !Pressing.shift) {
			if (Cube.selected.length) {
				Cube.selected.forEachReverse(el => el.unselect())
			}
			if (selected.length) {
				selected.forEachReverse(el => el !== this && el.unselect())
			}
		}

		ItemDisplay.selected.safePush(this)
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
		ItemDisplay.selected.remove(this)
		this.selected = false
		TickUpdates.selection = true
		this.preview_controller.updateHighlight(this)
	}
}
new Property(ItemDisplay, 'string', 'item', { default: 'minecraft:diamond' })
new Property(ItemDisplay, 'string', 'item_display', { default: 'none' })
new Property(ItemDisplay, 'object', 'config', {
	get default() {
		return new CommonDisplayConfig().toJSON()
	},
})
OutlinerElement.registerType(ItemDisplay, ItemDisplay.type)

export const PREVIEW_CONTROLLER = new NodePreviewController(ItemDisplay, {
	setup(el: ItemDisplay) {
		ResizableOutlinerElement.prototype.preview_controller.setup(el)
	},
	updateGeometry(el: ItemDisplay) {
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
			.finally(() => {
				el.ready = true
			})
	},
	updateTransform(el: ItemDisplay) {
		ResizableOutlinerElement.prototype.preview_controller.updateTransform(el)
	},
	updateHighlight(el: ItemDisplay, force?: boolean | ItemDisplay) {
		if (!isCurrentFormat() || !el?.mesh) return
		const highlighted = Modes.edit && (force === true || force === el || el.selected) ? 1 : 0

		const itemModel = el.mesh.children.at(0) as THREE.Mesh
		if (!itemModel) return
		for (const child of itemModel.children) {
			if (!(child instanceof THREE.Mesh)) continue
			const highlight = child.geometry.attributes.highlight

			if (highlight.array[0] != highlighted) {
				// @ts-ignore
				highlight.array.set(Array(highlight.count).fill(highlighted))
				highlight.needsUpdate = true
			}
		}
	},
})

class ItemDisplayAnimator extends BoneAnimator {
	private __name: string

	public uuid: string
	public element: ItemDisplay | undefined

	constructor(uuid: string, animation: _Animation, name: string) {
		super(uuid, animation, name)
		this.uuid = uuid
		this.__name = name
	}

	getElement() {
		this.element = OutlinerNode.uuids[this.uuid] as ItemDisplay
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
ItemDisplayAnimator.prototype.type = ItemDisplay.type
ItemDisplay.animator = ItemDisplayAnimator as any

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
			EVENTS.SELECT_PROJECT.subscribe(project => {
				project.vanillaItemDisplays ??= []
				ItemDisplay.all.empty()
				ItemDisplay.all.push(...project.vanillaItemDisplays)
			}),
			EVENTS.UNSELECT_PROJECT.subscribe(project => {
				project.vanillaItemDisplays = [...ItemDisplay.all]
				ItemDisplay.all.empty()
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

export const CREATE_ACTION = createAction(`${PACKAGE.name}:create_item_display`, {
	name: translate('action.create_item_display.title'),
	icon: 'icecream',
	category: 'animated_java',
	condition() {
		return isCurrentFormat() && Mode.selected.id === Modes.options.edit.id
	},
	click() {
		Undo.initEdit({ outliner: true, elements: [], selection: true })

		const vanillaItemDisplay = new ItemDisplay({}).init()
		const group = getCurrentGroup()

		if (group instanceof Group) {
			vanillaItemDisplay.addTo(group)
			vanillaItemDisplay.extend({ position: group.origin.slice() as ArrayVector3 })
		}

		selected.forEachReverse(el => el.unselect())
		Group.all.forEachReverse(el => el.unselect())
		vanillaItemDisplay.select()

		Undo.finishEdit('Create Vanilla Item Display', {
			outliner: true,
			elements: selected,
			selection: true,
		})

		return vanillaItemDisplay
	},
})
