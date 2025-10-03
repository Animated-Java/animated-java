import {
	type IBlueprintTextDisplayConfigJSON,
	activeProjectIsBlueprintFormat,
} from '../blueprintFormat'
import { PACKAGE } from '../constants'
import { registerAction } from '../util/moddingTools'
// import * as MinecraftFull from '../assets/MinecraftFull.json'
import { JsonParserError } from 'src/systems/jsonText/parser'
import { TextDisplayConfig } from '../nodeConfigs'
import { JsonText } from '../systems/jsonText'
import { getVanillaFont } from '../systems/minecraft/fontManager'
import EVENTS from '../util/events'
import { Valuable } from '../util/stores'
import { translate } from '../util/translation'
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

export class TextDisplay extends ResizableOutlinerElement {
	static type = `${PACKAGE.name}:text_display`
	static icon = 'text_fields'
	static selected: TextDisplay[] = []
	static all: TextDisplay[] = []

	public type = TextDisplay.type
	public icon = TextDisplay.icon
	public needsUniqueName = true

	// Properties
	public config: IBlueprintTextDisplayConfigJSON

	public buttons = [Outliner.buttons.export, Outliner.buttons.locked, Outliner.buttons.visibility]
	// eslint-disable-next-line @typescript-eslint/naming-convention
	public preview_controller = PREVIEW_CONTROLLER

	public ready = false
	public textError = new Valuable('')

	private _isUpdating = false
	private _text = new Valuable('Hello World!')
	private _lineWidth = new Valuable(200)
	private _backgroundColor = new Valuable('#000000')
	private _backgroundAlpha = new Valuable(0.25)
	private _shadow = new Valuable(false)
	private _align = new Valuable<Alignment>('center')
	public seeThrough = false

	constructor(data: TextDisplayOptions, uuid = guid()) {
		super(data, uuid)
		TextDisplay.all.push(this)

		for (const key in TextDisplay.properties) {
			TextDisplay.properties[key].reset(this)
		}

		this.name = 'text_display'
		this.extend(data)

		this.name ??= 'text_display'
		this.position ??= [0, 0, 0]
		this.rotation ??= [0, 0, 0]
		this.scale ??= [1, 1, 1]
		this.align ??= 'center'
		this.visibility ??= true
		this.config ??= {}

		this.sanitizeName()

		this._text.subscribe(() => this.updateText())
		this._lineWidth.subscribe(() => this.updateText())
		this._backgroundColor.subscribe(() => this.updateText())
		this._backgroundAlpha.subscribe(() => this.updateText())
		this._shadow.subscribe(() => this.updateText())
		this._align.subscribe(() => this.updateText())
	}

	public sanitizeName(): string {
		this.name = sanitizeOutlinerElementName(this.name, this.uuid)
		return this.name
	}

	get text() {
		if (this._text === undefined) return TextDisplay.properties['text'].default as string
		return this._text.get()
	}

	set text(value) {
		if (this._text === undefined) return
		if (value === this.text) return
		this._text.set(value)
	}

	get lineWidth() {
		if (this._lineWidth === undefined)
			return TextDisplay.properties['lineWidth'].default as number
		return this._lineWidth.get()
	}

	set lineWidth(value) {
		if (this._lineWidth === undefined) return
		this._lineWidth.set(value)
	}

	get backgroundColor() {
		if (this._backgroundColor === undefined)
			return TextDisplay.properties['backgroundColor'].default as string
		return this._backgroundColor.get()
	}

	set backgroundColor(value) {
		if (this._backgroundColor === undefined) return
		this._backgroundColor.set(value)
	}

	get backgroundAlpha() {
		if (this._backgroundAlpha === undefined)
			return TextDisplay.properties['backgroundAlpha'].default as number
		return this._backgroundAlpha.get()
	}

	set backgroundAlpha(value) {
		if (this._backgroundAlpha === undefined) return
		this._backgroundAlpha.set(value)
	}

	get shadow() {
		if (this._shadow === undefined) return TextDisplay.properties['shadow'].default as boolean
		return this._shadow.get()
	}

	set shadow(value) {
		if (this._shadow === undefined) return
		this._shadow.set(value)
	}

	get align() {
		if (this._align === undefined) return TextDisplay.properties['align'].default as Alignment
		return this._align.get()
	}

	set align(value) {
		if (this._align === undefined) return
		this._align.set(value)
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
		const save = super.getSaveCopy?.() ?? {}
		for (const key in TextDisplay.properties) {
			TextDisplay.properties[key].copy(this, save)
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

	async updateText() {
		if (this._isUpdating) return
		this._isUpdating = true

		if (Project?.loadingPromises) {
			// Wait to render text until after the project is done loading
			await Promise.all(Project?.loadingPromises)
		}

		let latestMesh: THREE.Mesh | undefined
		while (this._isUpdating) {
			let text: JsonText | undefined
			this.textError.set('')
			try {
				text = JsonText.fromString(
					this.text,
					Project!.animated_java.target_minecraft_version
				)
				console.log('Text updated:', text)
			} catch (e: any) {
				console.error(e)
				if (e instanceof JsonParserError) {
					this.textError.set(e.getOriginErrorMessage())
				} else {
					this.textError.set(e.message as string)
				}
				text = new JsonText({ text: 'Invalid JSON Text!', color: 'red' })
			}
			this._isUpdating = false
			if (text === undefined) {
				console.warn('Text is undefined, using fallback text')
				continue
			}
			latestMesh = await this.setText(text)
		}
		return latestMesh
	}

	async waitForReady() {
		while (!this.ready) {
			await new Promise(resolve => requestAnimationFrame(resolve))
		}
	}

	private async setText(jsonText: JsonText) {
		await this.waitForReady()
		const font = await getVanillaFont()
		// Hide the geo while rendering

		const { mesh: newMesh, outline } = await font.generateTextMesh({
			jsonText,
			maxLineWidth: this.lineWidth,
			backgroundColor: this.backgroundColor,
			backgroundAlpha: this.backgroundAlpha,
			shadow: this.shadow,
			alignment: this.align,
		})
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
	}
}
TextDisplay.prototype.icon = TextDisplay.icon
new Property(TextDisplay, 'string', 'text', { default: '"Hello World!"' })
new Property(TextDisplay, 'number', 'lineWidth', { default: 200 })
new Property(TextDisplay, 'string', 'backgroundColor', { default: '#000000' })
new Property(TextDisplay, 'number', 'backgroundAlpha', { default: 0.25 })
new Property(TextDisplay, 'string', 'align', { default: 'center' })
new Property(TextDisplay, 'boolean', 'shadow', { default: false })
new Property(TextDisplay, 'boolean', 'seeThrough', { default: false })
new Property(TextDisplay, 'object', 'config', {
	get default() {
		return new TextDisplayConfig().toJSON()
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

export const CREATE_ACTION = registerAction(
	{ id: `animated-java:create-text-display` },
	{
		name: translate('action.create_text_display.title'),
		icon: 'text_fields',
		category: 'animated_java',
		condition() {
			return activeProjectIsBlueprintFormat() && Mode.selected.id === Modes.options.edit.id
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
			Group.first_selected && Group.first_selected.unselect()
			textDisplay.select()

			Undo.finishEdit('Create Text Display', {
				outliner: true,
				elements: selected,
				selection: true,
			})

			return textDisplay
		},
	}
)

const unsubscribers: Array<() => void> = []

CREATE_ACTION.onCreated(action => {
	Interface.Panels.outliner.menu.addAction(action, 3)
	Toolbars.outliner.add(action, 0)
	MenuBar.menus.edit.addAction(action, 8)

	unsubscribers.push(
		EVENTS.SELECT_PROJECT.subscribe(project => {
			if (!activeProjectIsBlueprintFormat()) return
			project.textDisplays ??= []
			TextDisplay.all.empty()
			TextDisplay.all.push(...project.textDisplays)
		}),

		EVENTS.UNSELECT_PROJECT.subscribe(project => {
			if (!activeProjectIsBlueprintFormat()) return
			project.textDisplays = [...TextDisplay.all]
			TextDisplay.all.empty()
		})
	)
})

CREATE_ACTION.onDeleted(action => {
	Interface.Panels.outliner.menu.removeAction(action)
	Toolbars.outliner.remove(action)
	MenuBar.menus.edit.removeAction(action)

	unsubscribers.forEach(unsub => unsub())
})
