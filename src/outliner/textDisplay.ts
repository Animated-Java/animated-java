import { PACKAGE } from '../constants'
import {
	type IBlueprintTextDisplayConfigJSON,
	activeProjectIsBlueprintFormat,
} from '../formats/blueprint'
import { registerAction } from '../util/moddingTools'
// import * as MinecraftFull from '../assets/MinecraftFull.json'
import { JsonTextSyntaxError } from 'src/systems/jsonText/parser'
import { TextDisplayConfig } from '../nodeConfigs'
import { JsonText, TextElement } from '../systems/jsonText'
import { getVanillaFont, MinecraftFont } from '../systems/minecraft/fontManager'
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
	static invalidJsonText: TextElement = { text: 'Invalid JSON Text!', color: 'red' }

	type = TextDisplay.type
	icon = TextDisplay.icon
	needsUniqueName = true

	// Properties
	config: IBlueprintTextDisplayConfigJSON

	buttons = [Outliner.buttons.export, Outliner.buttons.locked, Outliner.buttons.visibility]
	// eslint-disable-next-line @typescript-eslint/naming-convention
	preview_controller = PREVIEW_CONTROLLER

	textError = new Valuable('')

	private __pendingMeshUpdate?: ReturnType<MinecraftFont['generateTextDisplayMesh']>
	private __text = new Valuable('Hello World!')
	private __lineWidth = TextDisplay.properties.lineWidth.default as number
	private __backgroundColor = TextDisplay.properties.backgroundColor.default as string
	private __shadow = TextDisplay.properties.shadow.default as boolean
	private __align: Alignment = TextDisplay.properties.align.default as Alignment
	seeThrough = TextDisplay.properties.seeThrough.default as boolean

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
	}

	sanitizeName(): string {
		this.name = sanitizeOutlinerElementName(this.name, this.uuid)
		return this.name
	}

	get text() {
		if (this.__text === undefined) return TextDisplay.properties.text.default as string
		return this.__text.get()
	}

	set text(value) {
		if (this.__text === undefined) return
		if (value === this.text) return
		this.__text.set(value)
		void this.updateTextMesh()
	}

	get lineWidth() {
		if (this.__lineWidth === undefined)
			return TextDisplay.properties.lineWidth.default as number
		return this.__lineWidth
	}

	set lineWidth(value) {
		if (this.__lineWidth === undefined) return
		if (value === this.lineWidth) return
		this.__lineWidth = value
		void this.updateTextMesh()
	}

	get backgroundColor() {
		if (this.__backgroundColor === undefined)
			return TextDisplay.properties.backgroundColor.default as string
		return this.__backgroundColor
	}

	set backgroundColor(value) {
		if (this.__backgroundColor === undefined) return
		if (value === this.backgroundColor) return
		this.__backgroundColor = value
		void this.updateTextMesh()
	}

	get shadow() {
		if (this.__shadow === undefined) return TextDisplay.properties.shadow.default as boolean
		return this.__shadow
	}

	set shadow(value) {
		if (this.__shadow === undefined) return
		if (value === this.shadow) return
		this.__shadow = value
		void this.updateTextMesh()
	}

	get align() {
		if (this.__align === undefined) return TextDisplay.properties.align.default as Alignment
		return this.__align
	}

	set align(value) {
		if (this.__align === undefined) return
		if (value === this.align) return
		this.__align = value
		void this.updateTextMesh()
	}

	getTextValuable() {
		return this.__text
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

	updateTextMesh() {
		let result: JsonText | undefined
		try {
			result = JsonText.fromString(this.text, {
				minecraftVersion: Project!.animated_java.target_minecraft_version,
			})
			this.textError.set('')
		} catch (e: any) {
			console.error(e)
			if (e instanceof JsonTextSyntaxError) {
				this.textError.set(e.getOriginErrorMessage())
			} else {
				this.textError.set(e.message as string)
			}
		}
		result ??= new JsonText({ text: 'Invalid JSON Text!', color: 'red' })
		void this.renderTextMesh(result).then(({ mesh, hitbox, outline }) => {
			this.applyTextMesh(mesh, hitbox, outline)
		})
	}

	private async renderTextMesh(jsonText: JsonText) {
		const promise = getVanillaFont()
			.then(font =>
				font.generateTextDisplayMesh({
					jsonText,
					maxLineWidth: this.lineWidth,
					backgroundColor: tinycolor(this.backgroundColor),
					shadow: this.shadow,
					alignment: this.align,
				})
			)
			.then(result => {
				if (this.__pendingMeshUpdate === promise) {
					this.__pendingMeshUpdate = undefined
					return result
				}
				return this.__pendingMeshUpdate
			}) as ReturnType<MinecraftFont['generateTextDisplayMesh']>

		this.__pendingMeshUpdate = promise
		return promise
	}

	private applyTextMesh(
		text: THREE.Mesh,
		hitbox: THREE.BufferGeometry,
		outline: THREE.LineSegments
	) {
		text.name = this.uuid + '_text'
		text.isTextDisplayText = true

		const mesh = this.mesh as THREE.Mesh
		mesh.clear()
		delete mesh.sprite
		mesh.name = this.uuid
		mesh.material = Canvas.transparentMaterial
		mesh.geometry = hitbox
		mesh.add(text)

		outline.name = this.uuid + '_outline'
		outline.visible = this.selected
		mesh.outline = outline
		mesh.add(outline)
		mesh.visible = this.visibility

		return text
	}
}
TextDisplay.prototype.icon = TextDisplay.icon
new Property(TextDisplay, 'string', 'text', { default: '"Hello World!"' })
new Property(TextDisplay, 'number', 'lineWidth', { default: 200 })
new Property(TextDisplay, 'string', 'backgroundColor', { default: '#00000040' })
new Property(TextDisplay, 'string', 'align', { default: 'center' })
new Property(TextDisplay, 'boolean', 'shadow', { default: false })
new Property(TextDisplay, 'boolean', 'seeThrough', { default: false })
new Property(TextDisplay, 'object', 'config', {
	get default() {
		return new TextDisplayConfig().toJSON()
	},
})

OutlinerElement.registerType(TextDisplay, TextDisplay.type)

const TEMP_MESH_MAP = new THREE.TextureLoader().load(
	'data:image/svg+xml,' +
		encodeURIComponent(
			`<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e3e3e3"><path d="M280-160v-520H80v-120h520v120H400v520H280Zm360 0v-320H520v-120h360v120H760v320H640Z"/></svg>`
		)
)
TEMP_MESH_MAP.minFilter = THREE.NearestFilter
TEMP_MESH_MAP.magFilter = THREE.NearestFilter

export const PREVIEW_CONTROLLER = new NodePreviewController(TextDisplay, {
	setup(el: TextDisplay) {
		ResizableOutlinerElement.prototype.preview_controller.setup(el)
		// Setup temp sprite mesh
		const material = new THREE.SpriteMaterial({
			map: TEMP_MESH_MAP,
			alphaTest: 0.1,
			sizeAttenuation: false,
		})
		const sprite = new THREE.Sprite(material)
		sprite.scale.setScalar(1 / 32)
		const mesh = el.mesh as THREE.Mesh
		mesh.add(sprite)
		mesh.sprite = sprite

		// Minecraft's transparency is funky 😭
		mesh.renderOrder = -1
		el.preview_controller.dispatchEvent('setup', { element: el })
	},

	updateGeometry(el: TextDisplay) {
		el.updateTextMesh()
	},

	updateTransform(el: TextDisplay) {
		ResizableOutlinerElement.prototype.preview_controller.updateTransform(el)
	},
})

class TextDisplayAnimator extends BoneAnimator {
	uuid: string
	element: TextDisplay | undefined

	constructor(uuid: string, animation: _Animation, name: string) {
		super(uuid, animation, name)
		this.uuid = uuid
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

		if (this.element.parent && this.element.parent !== 'root') {
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
			Group.first_selected?.unselect()
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

const CLEANUP_CALLBACKS: Array<() => void> = []

CREATE_ACTION.onCreated(action => {
	Interface.Panels.outliner.menu.addAction(action, 3)
	Toolbars.outliner.add(action, 0)
	MenuBar.menus.edit.addAction(action, 8)

	CLEANUP_CALLBACKS.push(
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

	CLEANUP_CALLBACKS.forEach(unsub => unsub())
})
