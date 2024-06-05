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
import { ResizableOutlinerElement } from './resizableOutlinerElement'
import { TextDisplay } from './textDisplay'
import { VanillaBlockDisplay } from './vanillaBlockDisplay'

interface VanillaItemDisplayOptions {
	name?: string
	item?: string
	position?: ArrayVector3
	rotation?: ArrayVector3
	scale?: ArrayVector3
	visibility?: boolean
}

export class VanillaItemDisplay extends ResizableOutlinerElement {
	static type = `${PACKAGE.name}:vanilla_item_display`
	static selected: VanillaItemDisplay[] = []
	static all: VanillaItemDisplay[] = []

	public type = VanillaItemDisplay.type
	public icon = 'icecream'
	public needsUniqueName = true

	// Properties
	public _item = new Valuable('minecraft:diamond')
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

		this.name = 'vanilla_item_display'
		this.extend(data)

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

		this._item.subscribe(value => {
			updateItem(value)
		})
	}

	get item() {
		if (this._item === undefined) return 'minecraft:diamond'
		return this._item.get()
	}
	set item(value: string) {
		if (this._item === undefined) return
		this._item.set(value)
	}

	public sanitizeName(): string {
		this.name = toSafeFuntionName(this.name)
		const otherNodes = [
			...VanillaItemDisplay.all.filter(v => v.uuid !== this.uuid),
			...Group.all,
			...TextDisplay.all,
			...VanillaBlockDisplay.all,
		]
		const otherNames = new Set(otherNodes.map(v => v.name))

		if (!otherNames.has(this.name)) {
			return this.name
		}

		let i = 1
		const match = this.name.match(/\d+$/)
		if (match) {
			i = parseInt(match[0])
			this.name = this.name.slice(0, -match[0].length)
		}

		let maxTries = 10000
		while (maxTries-- > 0) {
			const newName = `${this.name}${i}`
			if (!otherNames.has(newName)) {
				this.name = newName
				return newName
			}
			i++
		}

		throw new Error('Could not make VanillaItemDisplay name unique!')
	}

	getUndoCopy() {
		const copy: any = {}

		for (const key in VanillaItemDisplay.properties) {
			VanillaItemDisplay.properties[key].copy(this, copy)
		}

		copy.uuid = this.uuid
		copy.type = this.type
		// delete copy.parent
		// eslint-disable-next-line @typescript-eslint/no-unsafe-return
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
}
new Property(VanillaItemDisplay, 'string', 'item', { default: 'minecraft:diamond' })
new Property(VanillaItemDisplay, 'object', 'config', {
	get default() {
		return new BoneConfig().toJSON()
	},
})
OutlinerElement.registerType(VanillaItemDisplay, VanillaItemDisplay.type)

export const PREVIEW_CONTROLLER = new NodePreviewController(VanillaItemDisplay, {
	setup(el: VanillaItemDisplay) {
		ResizableOutlinerElement.prototype.preview_controller.setup(el)
	},
	updateGeometry(el: VanillaItemDisplay) {
		if (!el.mesh) return
		const currentModel = el.mesh.children.at(0)
		if (currentModel?.name === el.item) {
			el.preview_controller.updateTransform(el)
			return
		}

		void getItemModel(el.item)
			.then(result => {
				if (!result) return

				el.mesh.clear()
				el.mesh.add(result.mesh)
				el.mesh.add(result.outline)
				el.mesh.outline = result.outline

				el.preview_controller.updateHighlight(el)
				el.preview_controller.updateTransform(el)
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
		ResizableOutlinerElement.prototype.preview_controller.updateTransform(el)
	},
	updateHighlight(element: VanillaItemDisplay, force?: boolean | VanillaItemDisplay) {
		if (!isCurrentFormat() || !element?.mesh) return
		const highlighted =
			Modes.edit && (force === true || force === element || element.selected) ? 1 : 0

		const blockModel = element.mesh.children.at(0) as THREE.Mesh
		if (!blockModel) return

		const highlight = blockModel.geometry.attributes.highlight
		if (highlight && highlight.array[0] != highlighted) {
			// @ts-ignore
			highlight.array.set(Array(highlight.count).fill(highlighted))
			highlight.needsUpdate = true
		}

		for (const child of blockModel.children) {
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
			bone.rotation.copy(bone.fix_rotation as THREE.Euler)
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
