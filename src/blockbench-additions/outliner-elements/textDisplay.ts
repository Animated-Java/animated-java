import { PACKAGE } from '../../constants'
import {
	createAction,
	createBlockbenchMod,
	fixClassPropertyInheritance,
	ObjectProperty,
} from '../../util/moddingTools'
import { BLUEPRINT_FORMAT, isCurrentFormat } from '../model-formats/ajblueprint'
// import * as MinecraftFull from '@assets/MinecraftFull.json'
import { getVanillaFont } from '@aj/systems/minecraft-temp/fontManager'
import { CommonDisplayConfig, TextDisplayConfig, type Serialized } from '@aj/systems/node-configs'
import EVENTS from '@events'

import { TEXT_DISPLAY_CONFIG_ACTION } from '../../ui/dialogs/text-display-config'
import { Valuable } from '../../util/stores'
import { translate } from '../../util/translation'
import { ResizableOutlinerElement } from './resizableOutlinerElement'
import { sanitizeOutlinerElementName } from './util'

interface TextDisplayOptions {
	name?: string
	text?: string
	position?: ArrayVector3
	rotation?: ArrayVector3
	scale?: ArrayVector3
	lineLength?: number
	backgroundColor?: string
	backgroundAlpha?: number
	align?: Alignment
	visibility?: boolean
}
export type Alignment = 'left' | 'center' | 'right'

@fixClassPropertyInheritance
export class TextDisplay extends ResizableOutlinerElement {
	static type = `${PACKAGE.name}:text_display`
	static selected: TextDisplay[] = []
	static all: TextDisplay[] = []

	public type = TextDisplay.type
	public icon = 'text_fields'
	public needsUniqueName = true

	// Properties
	public config: Serialized<TextDisplayConfig>
	public commonConfig: Serialized<CommonDisplayConfig>

	public menu = new Menu([
		...Outliner.control_menu_group,
		TEXT_DISPLAY_CONFIG_ACTION,
		'_',
		'rename',
		'delete',
	])
	public buttons = [Outliner.buttons.export, Outliner.buttons.locked, Outliner.buttons.visibility]
	// eslint-disable-next-line @typescript-eslint/naming-convention
	public preview_controller = PREVIEW_CONTROLLER

	public ready = false
	public textError = new Valuable('')

	private __renderingTextComponent = false

	constructor(data: TextDisplayOptions, uuid = guid()) {
		super(data, uuid)
		TextDisplay.all.safePush(this)

		for (const key in TextDisplay.properties) {
			TextDisplay.properties[key].reset(this)
		}

		this.name = 'text_display'
		this.extend(data)

		this.name ??= 'text_display'
		this.position ??= [0, 0, 0]
		this.rotation ??= [0, 0, 0]
		this.scale ??= [1, 1, 1]
		this.visibility ??= true
		this.config ??= {}
		this.commonConfig ??= {}

		this.sanitizeName()
	}

	public sanitizeName(): string {
		this.name = sanitizeOutlinerElementName(this.name, this.uuid)
		return this.name
	}

	public extend(data: any) {
		for (const key in TextDisplay.properties) {
			TextDisplay.properties[key].merge(this, data)
		}
		return this
	}

	getUndoCopy() {
		const copy = new TextDisplay(this)

		for (const key in TextDisplay.properties) {
			TextDisplay.properties[key].copy(this, copy)
		}

		copy.uuid = this.uuid
		copy.type = this.type
		delete copy.parent
		return copy
	}

	getSaveCopy() {
		const el: any = {}
		for (const key in TextDisplay.properties) {
			TextDisplay.properties[key].copy(this, el)
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

		TextDisplay.selected.safePush(this)
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
		TextDisplay.selected.remove(this)
		this.selected = false
		TickUpdates.selection = true
	}

	async waitForReady() {
		while (!this.ready) {
			await new Promise(resolve => requestAnimationFrame(resolve))
		}
	}

	async updateText() {
		if (this.__renderingTextComponent) return
		try {
			this.__renderingTextComponent = true
			await this.waitForReady()
			const font = await getVanillaFont()
			const config = new TextDisplayConfig().fromJSON(
				this.config
			) as Required<TextDisplayConfig>
			const { mesh: newMesh, outline } = await font.generateTextMesh(config)
			newMesh.name = this.uuid + '_text'
			const previousMesh = this.mesh.children.find(v => v.name === newMesh.name)
			if (previousMesh) this.mesh.remove(previousMesh)

			const mesh = this.mesh as THREE.Mesh
			mesh.name = this.uuid
			mesh.geometry = (newMesh.children[0] as THREE.Mesh).geometry.clone()
			mesh.geometry.translate(
				newMesh.children[0].position.x,
				newMesh.children[0].position.y,
				newMesh.children[0].position.z
			)
			mesh.geometry.rotateY(Math.PI)
			mesh.geometry.scale(newMesh.scale.x, newMesh.scale.y, newMesh.scale.z)
			mesh.material = Canvas.transparentMaterial

			mesh.add(newMesh)

			outline.name = this.uuid + '_outline'
			outline.visible = this.selected
			mesh.outline = outline
			const previousOutline = mesh.children.find(v => v.name === outline.name)
			if (previousOutline) mesh.remove(previousOutline)
			mesh.add(outline)
			mesh.visible = this.visibility
			return newMesh
		} catch (err: any) {
			console.error(err)
			this.textError.set(err.message)
		} finally {
			this.__renderingTextComponent = false
		}
	}
}
new ObjectProperty(TextDisplay, 'config', {
	get default() {
		return new TextDisplayConfig().toJSON()
	},
})

new ObjectProperty(TextDisplay, 'commonConfig', {
	get default() {
		return new CommonDisplayConfig().toJSON()
	},
})

OutlinerElement.registerType(TextDisplay, TextDisplay.type)

export const PREVIEW_CONTROLLER = new NodePreviewController(TextDisplay, {
	setup(el: TextDisplay) {
		ResizableOutlinerElement.prototype.preview_controller.setup(el)
		// Minecraft's transparency is funky 😭
		Project!.nodes_3d[el.uuid].renderOrder = -1

		void getVanillaFont()
			.then(() => {
				el.preview_controller.updateTransform(el)
				el.preview_controller.updateGeometry(el)
				el.preview_controller.dispatchEvent('setup', { element: el })
			})
			.finally(() => {
				el.ready = true
			})
	},
	updateGeometry(el: TextDisplay) {
		void el.updateText().then(() => {
			el.preview_controller.updateTransform(el)
		})
	},
	updateTransform(el: TextDisplay) {
		ResizableOutlinerElement.prototype.preview_controller.updateTransform(el)
	},
})

class TextDisplayAnimator extends BoneAnimator {
	private __name: string

	public uuid: string
	public element: TextDisplay | undefined

	constructor(uuid: string, animation: _Animation, name: string) {
		super(uuid, animation, name)
		this.uuid = uuid
		this.__name = name
	}

	getElement() {
		this.element = OutlinerNode.uuids[this.uuid] as TextDisplay
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
		if (bone.fix_scale) {
			bone.scale.copy(bone.fix_scale)
		}
		bone.scale.x *= 1 + (arr[0] - 1) * multiplier || 0.00001
		bone.scale.y *= 1 + (arr[1] - 1) * multiplier || 0.00001
		bone.scale.z *= 1 + (arr[2] - 1) * multiplier || 0.00001
		return this
	}
}
TextDisplayAnimator.prototype.type = TextDisplay.type
TextDisplay.animator = TextDisplayAnimator as any

createBlockbenchMod(
	`${PACKAGE.name}:textDisplay`,
	{
		subscriptions: [] as Array<() => void>,
	},
	context => {
		Interface.Panels.outliner.menu.addAction(CREATE_ACTION, 3)
		Toolbars.outliner.add(CREATE_ACTION, 0)
		MenuBar.menus.edit.addAction(CREATE_ACTION, 8)

		context.subscriptions.push(
			EVENTS.SELECT_PROJECT.subscribe(project => {
				if (project.format.id !== BLUEPRINT_FORMAT.id) return
				project.textDisplays ??= []
				TextDisplay.all.empty()
				TextDisplay.all.push(...project.textDisplays)
			}),
			EVENTS.UNSELECT_PROJECT.subscribe(project => {
				if (project.format.id !== BLUEPRINT_FORMAT.id) return
				project.textDisplays = [...TextDisplay.all]
				TextDisplay.all.empty()
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

export const CREATE_ACTION = createAction(`${PACKAGE.name}:create_text_display`, {
	name: translate('action.create_text_display.title'),
	icon: 'text_fields',
	category: 'animated_java',
	condition() {
		return isCurrentFormat() && Mode.selected.id === Modes.options.edit.id
	},
	click() {
		Undo.initEdit({ outliner: true, elements: [], selection: true })

		const textDisplay = new TextDisplay({}).init()
		const group = getCurrentGroup()

		if (group instanceof Group) {
			textDisplay.addTo(group)
			textDisplay.extend({ position: group.origin.slice() as ArrayVector3 })
		}

		selected.forEachReverse(el => el.unselect())
		Group.all.forEachReverse(el => el.unselect())
		textDisplay.select()

		Undo.finishEdit('Create Text Display', {
			outliner: true,
			elements: selected,
			selection: true,
		})

		return textDisplay
	},
})
