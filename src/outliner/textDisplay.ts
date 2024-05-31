import {
	BLUEPRINT_FORMAT,
	IBlueprintTextDisplayConfigJSON,
	isCurrentFormat,
} from '../blueprintFormat'
import { PACKAGE } from '../constants'
import { createAction, createBlockbenchMod } from '../util/moddingTools'
// import * as MinecraftFull from '../assets/MinecraftFull.json'
import { getVanillaFont } from '../systems/minecraft/fontManager'
import { JsonText } from '../systems/minecraft/jsonText'
import TextDisplayLoading from '../assets/text_display_loading.webp'
import { Valuable } from '../util/stores'
import { toSafeFuntionName } from '../util/minecraftUtil'
import { TextDisplayConfig } from '../nodeConfigs'
import { TEXT_DISPLAY_CONFIG_ACTION } from '../interface/textDisplayConfigDialog'
import { events } from '../util/events'
import { translate } from '../util/translation'

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
type Alignment = 'left' | 'center' | 'right'

export class TextDisplay extends OutlinerElement {
	static type = `${PACKAGE.name}:text_display`
	static selected: TextDisplay[] = []
	static all: TextDisplay[] = []

	public type = TextDisplay.type
	public icon = 'text_fields'
	public movable = true
	public rotatable = true
	// public resizable = true
	public scalable = true
	public needsUniqueName = true

	// Properties
	public name: string
	public position: ArrayVector3
	public rotation: ArrayVector3
	public scale: ArrayVector3
	public align: Alignment
	public visibility
	public config: IBlueprintTextDisplayConfigJSON

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
	public loadingMesh: THREE.Mesh = new THREE.Mesh()
	public ready = false

	public textError = new Valuable('')

	private _updating = false
	private _text = new Valuable('Hello World!')
	private _newText: string | undefined
	private _lineWidth = new Valuable(200)
	private _newLineWidth: number | undefined
	private _backgroundColor = new Valuable('#000000')
	private _newBackgroundColor: string | undefined
	private _backgroundAlpha = new Valuable(0.25)
	private _newBackgroundAlpha: number | undefined
	private _shadow = new Valuable(false)
	private _newShadow: boolean | undefined

	constructor(data: TextDisplayOptions, uuid = guid()) {
		super(data, uuid)
		TextDisplay.all.push(this)

		for (const key in TextDisplay.properties) {
			TextDisplay.properties[key].reset(this)
		}

		this.extend(data)

		this.name ??= 'text_display'
		this.position ??= [0, 0, 0]
		this.rotation ??= [0, 0, 0]
		this.scale ??= [1, 1, 1]
		this.align ??= 'center'
		this.visibility ??= true
		this.config ??= {}

		this.sanitizeName()

		this._text.subscribe(v => {
			this._newText = v
			void this.updateText()
		})
		this._lineWidth.subscribe(v => {
			this._newLineWidth = v
			void this.updateText()
		})
		this._backgroundColor.subscribe(v => {
			this._newBackgroundColor = v
			void this.updateText()
		})
		this._backgroundAlpha.subscribe(v => {
			this._newBackgroundAlpha = v
			void this.updateText()
		})
		this._shadow.subscribe(v => {
			this._newShadow = v
			void this.updateText()
		})
	}

	public sanitizeName(): string {
		this.name = toSafeFuntionName(this.name)
		if (!TextDisplay.all.some(v => v !== this && v.name === this.name)) {
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
			if (!TextDisplay.all.some(v => v !== this && v.name === newName)) {
				return newName
			}
			i++
		}

		throw new Error('Could not make TextDisplay name unique!')
	}

	get text() {
		return this._text.get()
	}

	set text(value) {
		this._text.set(value)
	}

	get lineWidth() {
		return this._lineWidth.get()
	}

	set lineWidth(value) {
		this._lineWidth.set(value)
	}

	get backgroundColor() {
		return this._backgroundColor.get()
	}

	set backgroundColor(value) {
		this._backgroundColor.set(value)
	}

	get backgroundAlpha() {
		return this._backgroundAlpha.get()
	}

	set backgroundAlpha(value) {
		this._backgroundAlpha.set(value)
	}

	get shadow() {
		return this._shadow.get()
	}

	set shadow(value) {
		this._shadow.set(value)
	}

	extend(data: TextDisplayOptions) {
		for (const key in TextDisplay.properties) {
			TextDisplay.properties[key].merge(this, data)
		}
		if (data.visibility !== undefined) {
			this.visibility = data.visibility
		}

		return this
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

		TextDisplay.selected.safePush(this)
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
		TextDisplay.selected.remove(this)
		this.selected = false
		TickUpdates.selection = true
	}

	async updateText() {
		if (this._updating) return
		this._updating = true
		while (
			this._newText !== undefined ||
			this._newLineWidth !== undefined ||
			this._newBackgroundColor !== undefined ||
			this._newBackgroundAlpha !== undefined ||
			this._newShadow !== undefined
		) {
			let text: JsonText | undefined
			this.textError.set('')
			try {
				text = JsonText.fromString(this.text)
			} catch (e: any) {
				console.error(e)
				this.textError.set(e.message as string)
				this._updating = false
			}
			this._newText = undefined
			this._newLineWidth = undefined
			this._newBackgroundColor = undefined
			this._newBackgroundAlpha = undefined
			this._newShadow = undefined
			if (!text) continue
			await this.setText(text)
		}
		this._updating = false
	}

	async waitForReady() {
		while (!this.ready) {
			await new Promise(resolve => setTimeout(resolve, 100))
		}
	}

	private async setText(jsonText: JsonText) {
		await this.waitForReady()
		const font = await getVanillaFont()
		// Hide the geo while rendering
		this.loadingMesh.visible = true

		const { mesh, outline } = await font.generateTextMesh({
			jsonText,
			maxLineWidth: this.lineWidth,
			backgroundColor: this.backgroundColor,
			backgroundAlpha: this.backgroundAlpha,
			shadow: this.shadow,
		})
		mesh.name = this.uuid + '_text'
		const previousMesh = this.mesh.children.find(v => v.name === mesh.name)
		if (previousMesh) this.mesh.remove(previousMesh)
		this.mesh.add(mesh)

		outline.name = this.uuid + '_outline'
		outline.visible = this.selected
		this.mesh.outline = outline
		const previousOutline = this.mesh.children.find(v => v.name === outline.name)
		if (previousOutline) this.mesh.remove(previousOutline)
		this.mesh.add(outline)
		this.mesh.visible = this.visibility

		this.loadingMesh.visible = false
	}
}
new Property(TextDisplay, 'string', 'name', { default: 'text_display' })
new Property(TextDisplay, 'string', 'text', { default: '"Hello World!"' })
new Property(TextDisplay, 'vector', 'position', { default: [0, 0, 0] })
new Property(TextDisplay, 'vector', 'rotation', { default: [0, 0, 0] })
new Property(TextDisplay, 'vector', 'scale', { default: [1, 1, 1] })
new Property(TextDisplay, 'number', 'lineWidth', { default: 200 })
new Property(TextDisplay, 'string', 'backgroundColor', { default: '#000000' })
new Property(TextDisplay, 'number', 'backgroundAlpha', { default: 0.25 })
new Property(TextDisplay, 'string', 'align', { default: 'center' })
new Property(TextDisplay, 'string', 'visibility', { default: true })
new Property(TextDisplay, 'object', 'config', {
	get default() {
		return new TextDisplayConfig().toJSON()
	},
})
OutlinerElement.registerType(TextDisplay, TextDisplay.type)

export const PREVIEW_CONTROLLER = new NodePreviewController(TextDisplay, {
	setup(el: TextDisplay) {
		const textMesh = new THREE.Mesh(new THREE.PlaneGeometry(0, 0))
		textMesh.fix_rotation = new THREE.Euler(...el.rotation, 'ZYX')
		textMesh.fix_position = new THREE.Vector3(...el.position)
		textMesh.fix_scale = new THREE.Vector3(...el.scale)
		// Minecraft's transparency is funky 😭
		textMesh.renderOrder = -1

		new THREE.TextureLoader().load(TextDisplayLoading, texture => {
			texture.magFilter = THREE.NearestFilter
			texture.minFilter = THREE.NearestFilter
			const loadingGeo = new THREE.PlaneGeometry(
				texture.image.width / 5,
				texture.image.height / 5
			)
			loadingGeo.rotateY(Math.PI)
			loadingGeo.translate(0, texture.image.height / 2 / 5, 0)
			const loadingMaterial = new THREE.MeshBasicMaterial({ map: texture, transparent: true })
			el.loadingMesh = new THREE.Mesh(loadingGeo, loadingMaterial)
			textMesh.add(el.loadingMesh)
			el.loadingMesh.visible = false
		})

		this.mesh = textMesh
		// FIXME: This will error if there is no Project loaded.
		Project!.nodes_3d[el.uuid] = textMesh

		void getVanillaFont().then(() => {
			el.loadingMesh.visible = false
			el.ready = true

			PREVIEW_CONTROLLER.updateTransform(el)
			PREVIEW_CONTROLLER.dispatchEvent('setup', { element: el })
		})
	},
	updateGeometry(el: TextDisplay) {
		PREVIEW_CONTROLLER.mesh.scale.set(...el.scale)
		void el.updateText()
	},
	updateTransform(el: TextDisplay) {
		NodePreviewController.prototype.updateTransform.call(PREVIEW_CONTROLLER, el)
		if (el.mesh.fix_position) {
			el.mesh.fix_position.set(...el.position)
			if (el.parent instanceof Group) {
				el.mesh.fix_position.x -= el.parent.origin[0]
				el.mesh.fix_position.y -= el.parent.origin[1]
				el.mesh.fix_position.z -= el.parent.origin[2]
			}
		}
		if (el.mesh.fix_rotation) {
			el.mesh.fix_rotation.set(...el.rotation)
		}
		if (el.mesh.fix_scale) {
			el.mesh.fix_scale.set(...el.scale)
		}
	},
})

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
		Group.selected && Group.selected.unselect()
		textDisplay.select()

		Undo.finishEdit('Create Text Display', {
			outliner: true,
			elements: selected,
			selection: true,
		})

		return textDisplay
	},
})

class TextDisplayAnimator extends BoneAnimator {
	private _name: string

	public uuid: string
	public element: TextDisplay | undefined

	constructor(uuid: string, animation: _Animation, name: string) {
		super(uuid, animation, name)
		this.uuid = uuid
		this._name = name
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
			events.SELECT_PROJECT.subscribe(project => {
				if (project.format.id !== BLUEPRINT_FORMAT.id) return
				console.log('SELECT_PROJECT')
				project.textDisplays ??= []
				TextDisplay.all.empty()
				TextDisplay.all.push(...project.textDisplays)
			}),
			events.UNSELECT_PROJECT.subscribe(project => {
				if (project.format.id !== BLUEPRINT_FORMAT.id) return
				console.log('UNSELECT_PROJECT')
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
