import { IBlueprintBoneConfigJSON, isCurrentFormat } from '../blueprintFormat'
import { PACKAGE } from '../constants'
import { VANILLA_BLOCK_DISPLAY_CONFIG_ACTION } from '../interface/vanillaBlockDisplayConfigDialog'
import { BoneConfig } from '../nodeConfigs'
import { getBlockModel } from '../systems/minecraft/blockModelManager'
import { MINECRAFT_REGISTRY } from '../systems/minecraft/registryManager'
import { getCurrentVersion } from '../systems/minecraft/versionManager'
import { events } from '../util/events'
import { toSafeFuntionName } from '../util/minecraftUtil'
import { createAction, createBlockbenchMod } from '../util/moddingTools'
import { Valuable } from '../util/stores'
import { translate } from '../util/translation'
import { ResizableOutlinerElement } from './resizableOutlinerElement'
import { TextDisplay } from './textDisplay'
import { VanillaItemDisplay } from './vanillaItemDisplay'

interface VanillaBlockDisplayOptions {
	name?: string
	block?: string
	position?: ArrayVector3
	rotation?: ArrayVector3
	scale?: ArrayVector3
	visibility?: boolean
}

export class VanillaBlockDisplay extends ResizableOutlinerElement {
	static type = `${PACKAGE.name}:vanilla_block_display`
	static selected: VanillaBlockDisplay[] = []
	static all: VanillaBlockDisplay[] = []

	public type = VanillaBlockDisplay.type
	public icon = 'deployed_code'
	public needsUniqueName = true

	// Properties
	public _block = new Valuable('minecraft:stone')
	public config: IBlueprintBoneConfigJSON

	public error = new Valuable('')

	public menu = new Menu([
		...Outliner.control_menu_group,
		VANILLA_BLOCK_DISPLAY_CONFIG_ACTION,
		'_',
		'rename',
		'delete',
	])
	public buttons = [Outliner.buttons.export, Outliner.buttons.locked, Outliner.buttons.visibility]
	// eslint-disable-next-line @typescript-eslint/naming-convention
	public preview_controller = PREVIEW_CONTROLLER

	constructor(data: VanillaBlockDisplayOptions, uuid = guid()) {
		super(data, uuid)
		VanillaBlockDisplay.all.push(this)

		for (const key in VanillaBlockDisplay.properties) {
			VanillaBlockDisplay.properties[key].reset(this)
		}

		this.name = 'vanilla_block_display'
		this.extend(data)

		this.block ??= 'minecraft:diamond'
		this.config ??= {}

		const updateBlock = (newBlock: string) => {
			if (!MINECRAFT_REGISTRY.block) {
				requestAnimationFrame(() => updateBlock(newBlock))
				return
			}
			const [namespace, id] = newBlock.split(':')
			if (
				(namespace === 'minecraft' || namespace === '') &&
				MINECRAFT_REGISTRY.block.has(id)
			) {
				this.error.set('')
				this.preview_controller.updateGeometry(this)
			} else {
				this.error.set(`This block does not exist in Minecraft ${getCurrentVersion()!.id}.`)
			}
		}

		this._block.subscribe(value => {
			updateBlock(value)
		})
	}

	get block() {
		if (this._block === undefined) return 'minecraft:stone'
		return this._block.get()
	}
	set block(value: string) {
		if (this._block === undefined) return
		this._block.set(value)
	}

	public sanitizeName(): string {
		this.name = toSafeFuntionName(this.name)
		const otherNodes = [
			...VanillaBlockDisplay.all.filter(v => v !== this),
			...Group.all,
			...TextDisplay.all,
			...VanillaItemDisplay.all,
		]
		if (!otherNodes.some(v => v !== this && v.name === this.name)) {
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
			if (!otherNodes.some(v => v !== this && v.name === newName)) {
				this.name = newName
				return newName
			}
			i++
		}

		throw new Error('Could not make VanillaBlockDisplay name unique!')
	}

	getUndoCopy() {
		const copy = new VanillaBlockDisplay(this)

		for (const key in VanillaBlockDisplay.properties) {
			VanillaBlockDisplay.properties[key].copy(this, copy)
		}

		copy.uuid = this.uuid
		copy.type = this.type
		delete copy.parent
		return copy
	}

	getSaveCopy() {
		const el: any = {}
		for (const key in VanillaBlockDisplay.properties) {
			VanillaBlockDisplay.properties[key].copy(this, el)
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

		VanillaBlockDisplay.selected.safePush(this)
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
		VanillaBlockDisplay.selected.remove(this)
		this.selected = false
		TickUpdates.selection = true
		this.preview_controller.updateHighlight(this)
	}
}
new Property(VanillaBlockDisplay, 'string', 'block', { default: 'minecraft:stone' })
new Property(VanillaBlockDisplay, 'object', 'config', {
	get default() {
		return new BoneConfig().toJSON()
	},
})
OutlinerElement.registerType(VanillaBlockDisplay, VanillaBlockDisplay.type)

export const PREVIEW_CONTROLLER = new NodePreviewController(VanillaBlockDisplay, {
	setup(el: VanillaBlockDisplay) {
		ResizableOutlinerElement.prototype.preview_controller.setup(el)
	},
	updateGeometry(el: VanillaBlockDisplay) {
		if (!el.mesh) return
		void getBlockModel(el.block)
			.then(result => {
				if (!result?.mesh) return

				el.mesh.clear()
				result.outline.name = el.uuid + '_outline'
				result.outline.visible = el.selected
				el.mesh.outline = result.outline
				el.mesh.add(result.mesh)
				el.mesh.add(result.outline)

				el.preview_controller.updateHighlight(el)
				el.preview_controller.updateTransform(el)
				el.mesh.visible = el.visibility
				TickUpdates.selection = true
			})
			.catch(err => {
				console.error(err)
				if (typeof err.message === 'string') {
					el.error.set(err.message as string)
				}
			})
	},
	updateTransform(el: VanillaBlockDisplay) {
		ResizableOutlinerElement.prototype.preview_controller.updateTransform(el)
	},
	updateHighlight(element: VanillaBlockDisplay, force?: boolean | VanillaBlockDisplay) {
		if (!isCurrentFormat() || !element?.mesh) return

		const vanillaBlockMesh = element.mesh.children.at(0) as THREE.Mesh
		if (!vanillaBlockMesh?.isVanillaBlockModel) return
		const highlighted =
			Modes.edit && (force === true || force === element || element.selected) ? 1 : 0

		for (const child of vanillaBlockMesh.children) {
			if (!(child instanceof THREE.Mesh && child.geometry)) continue
			const highlight = child.geometry.attributes.highlight
			if (highlight.array[0] != highlighted) {
				// @ts-ignore
				highlight.array.set(Array(highlight.count).fill(highlighted))
				highlight.needsUpdate = true
			}
		}
	},
})

class VanillaBlockDisplayAnimator extends BoneAnimator {
	private _name: string

	public uuid: string
	public element: VanillaBlockDisplay | undefined

	constructor(uuid: string, animation: _Animation, name: string) {
		super(uuid, animation, name)
		this.uuid = uuid
		this._name = name
	}

	getElement() {
		this.element = OutlinerNode.uuids[this.uuid] as VanillaBlockDisplay
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
				bone.rotation.x -= Math.degToRad(arr[0]) * multiplier
				bone.rotation.y -= Math.degToRad(arr[1]) * multiplier
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
		bone.scale.x *= 1 + (arr[0] - 1) * multiplier || 0.00001
		bone.scale.y *= 1 + (arr[1] - 1) * multiplier || 0.00001
		bone.scale.z *= 1 + (arr[2] - 1) * multiplier || 0.00001
		return this
	}
}
VanillaBlockDisplayAnimator.prototype.type = VanillaBlockDisplay.type
VanillaBlockDisplay.animator = VanillaBlockDisplayAnimator as any

createBlockbenchMod(
	`${PACKAGE.name}:vanillaBlockDisplay`,
	{
		subscriptions: [] as Array<() => void>,
	},
	context => {
		Interface.Panels.outliner.menu.addAction(CREATE_ACTION, 3)
		Toolbars.outliner.add(CREATE_ACTION, 0)
		MenuBar.menus.edit.addAction(CREATE_ACTION, 8)

		context.subscriptions.push(
			events.SELECT_PROJECT.subscribe(project => {
				project.vanillaBlockDisplays ??= []
				VanillaBlockDisplay.all.empty()
				VanillaBlockDisplay.all.push(...project.vanillaBlockDisplays)
			}),
			events.UNSELECT_PROJECT.subscribe(project => {
				project.vanillaBlockDisplays = [...VanillaBlockDisplay.all]
				VanillaBlockDisplay.all.empty()
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

export const CREATE_ACTION = createAction(`${PACKAGE.name}:create_vanilla_block_display`, {
	name: translate('action.create_vanilla_block_display.title'),
	icon: 'deployed_code',
	category: 'animated_java',
	condition() {
		return isCurrentFormat() && Mode.selected.id === Modes.options.edit.id
	},
	click() {
		Undo.initEdit({ outliner: true, elements: [], selection: true })

		const vanillaBlockDisplay = new VanillaBlockDisplay({}).init()
		const group = getCurrentGroup()

		if (group instanceof Group) {
			vanillaBlockDisplay.addTo(group)
			vanillaBlockDisplay.extend({ position: group.origin.slice() as ArrayVector3 })
		}

		selected.forEachReverse(el => el.unselect())
		Group.selected && Group.selected.unselect()
		vanillaBlockDisplay.select()

		Undo.finishEdit('Create Vanilla Block Display', {
			outliner: true,
			elements: selected,
			selection: true,
		})

		return vanillaBlockDisplay
	},
})
