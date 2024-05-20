import { isCurrentFormat } from '../blueprintFormat'
import { PACKAGE } from '../constants'
import { createAction, createBlockbenchMod } from '../util/moddingTools'
// import * as MinecraftFull from '../assets/MinecraftFull.json'
import { getVanillaFont } from '../systems/minecraft/fontManager'
import { JsonText } from '../systems/minecraft/jsonText'
import TextDisplayLoading from '../assets/text_display_loading.webp'
import { Valuable } from '../util/stores'
import { toSafeFuntionName } from '../util/minecraftUtil'

const DEFAULT_PLANE = new THREE.PlaneBufferGeometry(1, 1)
DEFAULT_PLANE.rotateY(Math.PI)
const INVISIBLE_PLANE = new THREE.PlaneBufferGeometry(0, 0)

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

const TEXT_SCALE = 8

export class TextDisplay extends OutlinerElement {
	static type = `${PACKAGE.name}:text_display`
	static selected: TextDisplay[] = []
	static all: TextDisplay[] = []

	public type = `${PACKAGE.name}:text_display`
	public icon = 'text_fields'
	public movable = true
	public rotatable = true
	// resizable causes issues, and I can't fix them because the internal Blockbench code is restrictive.
	// public resizable = true
	public scalable = true
	public needsUniqueName = true

	// Properties
	public name: string
	public position: ArrayVector3
	public rotation: ArrayVector3
	public scale: ArrayVector3
	public backgroundColor: string
	public backgroundAlpha: number
	public align: Alignment
	public visibility

	public textGeo: THREE.PlaneGeometry = new THREE.PlaneGeometry(1, 1)
	public canvas = document.createElement('canvas')
	public texture = new THREE.CanvasTexture(this.canvas)

	public menu = new Menu([...Outliner.control_menu_group, '_', 'rename', 'delete'])
	public buttons = [Outliner.buttons.export, Outliner.buttons.locked, Outliner.buttons.visibility]
	// eslint-disable-next-line @typescript-eslint/naming-convention
	public preview_controller = PREVIEW_CONTROLLER
	public loadingMesh: THREE.Mesh = new THREE.Mesh()
	public ready = false

	public textError = new Valuable('')
	private _text = new Valuable('Hello World!')
	private _newText: string | undefined
	private _lineWidth = new Valuable(200)
	private _newLineWidth: number | undefined
	private _updating = false

	constructor(data: TextDisplayOptions, uuid = guid()) {
		super(data, uuid)

		this.texture.magFilter = THREE.NearestFilter
		this.texture.minFilter = THREE.NearestFilter

		for (const key in TextDisplay.properties) {
			TextDisplay.properties[key].reset(this)
		}

		this.extend(data)

		this.name ??= 'Text Display'
		this.position ??= [0, 0, 0]
		this.rotation ??= [0, 0, 0]
		this.scale ??= [1, 1, 1]
		this.backgroundColor ??= '#000000'
		this.backgroundAlpha ??= 0.25
		this.align ??= 'center'
		this.visibility ??= true

		this.sanitizeName()

		this._text.subscribe(v => {
			this._newText = v
			void this.updateText()
		})
		this._lineWidth.subscribe(v => {
			this._newLineWidth = v
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

	extend(data: TextDisplayOptions) {
		for (const key in TextDisplay.properties) {
			TextDisplay.properties[key].merge(this, data)
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
			if (Cube.selected) {
				Cube.selected.forEachReverse(el => el.unselect())
			}
			if (TextDisplay.selected) {
				TextDisplay.selected.forEachReverse(el => el !== this && el.unselect())
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
		let text: JsonText | undefined

		if (this._newText) {
			this.textError.set('')
			try {
				text = JsonText.fromString(this._newText)
			} catch (e: any) {
				console.error(e)
				this.textError.set(e.message as string)
			}
			this._updating = false
			if (!text) return

			while (this._newText) {
				await this.setText(text)
				this._newText = undefined
			}
		}

		if (this._newLineWidth) {
			this.textError.set('')
			try {
				text = JsonText.fromString(this.text)
			} catch (e: any) {
				console.error(e)
				this.textError.set(e.message as string)
			}
			this._updating = false
			if (!text) return

			while (this._newLineWidth) {
				await this.setText(text)
				this._newLineWidth = undefined
			}
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
		const ctx = this.canvas.getContext('2d', { willReadFrequently: true })!
		// @ts-ignore
		const outline: THREE.LineSegments = this.mesh.outline
		// Hide the geo while rendering
		this.loadingMesh.visible = true
		this.textGeo.setAttribute('position', INVISIBLE_PLANE.getAttribute('position').clone())
		const map = (this.loadingMesh.material as THREE.MeshBasicMaterial).map
		if (map) {
			outline.scale.set(map.image.width / 5, map.image.height / 5, 1)
			outline.position.set(0, map.image.height / 10, 0)
		}

		await font.drawJsonTextToCanvas({
			ctx,
			jsonText,
			x: 1,
			y: 1,
			// lineWidth: 1000,
			lineWidth: this.lineWidth,
			scale: TEXT_SCALE,
			backgroundColor: this.backgroundColor,
			backgroundAlpha: this.backgroundAlpha,
		})

		this.texture.needsUpdate = true
		this.loadingMesh.visible = false

		// Set geo back to a 1 1 plane
		this.textGeo.setAttribute('position', DEFAULT_PLANE.getAttribute('position').clone())
		this.textGeo.scale(
			this.canvas.width / TEXT_SCALE / 2.5,
			this.canvas.height / TEXT_SCALE / 2.5,
			1
		)

		const xOffset = -(1 / 5)
		const scaleX = this.canvas.width / TEXT_SCALE / 2.5
		const scaleY = this.canvas.height / TEXT_SCALE / 2.5

		this.textGeo.center()
		this.textGeo.translate(xOffset, scaleY / 2, 0)

		// @ts-ignore
		const fix_position = this.mesh.fix_position as THREE.Vector3
		fix_position.set(...this.position)

		outline.scale.x = scaleX
		outline.scale.y = scaleY
		outline.position.x = xOffset
		outline.position.y = scaleY / 2
	}
}
new Property(TextDisplay, 'string', 'name', { default: 'Text Display' })
new Property(TextDisplay, 'string', 'text', { default: '"Hello World!"' })
new Property(TextDisplay, 'vector', 'position', { default: [0, 0, 0] })
new Property(TextDisplay, 'vector', 'rotation', { default: [0, 0, 0] })
new Property(TextDisplay, 'vector', 'scale', { default: [1, 1, 1] })
new Property(TextDisplay, 'number', 'lineWidth', { default: 200 })
new Property(TextDisplay, 'string', 'backgroundColor', { default: '#000000' })
new Property(TextDisplay, 'number', 'backgroundAlpha', { default: 0.25 })
new Property(TextDisplay, 'string', 'align', { default: 'center' })
new Property(TextDisplay, 'string', 'visibility', { default: true })
OutlinerElement.registerType(TextDisplay, TextDisplay.type)

export const PREVIEW_CONTROLLER = new NodePreviewController(TextDisplay, {
	setup(el: TextDisplay) {
		el.textGeo = new THREE.PlaneGeometry(1, 1)
		el.textGeo.rotateY(Math.PI)

		const material = new THREE.MeshBasicMaterial({ map: el.texture, transparent: true })
		const textMesh = new THREE.Mesh(el.textGeo, material)
		// @ts-ignore
		textMesh.fix_rotation = new THREE.Euler(0, 0, 0, 'ZYX')
		// @ts-ignore
		textMesh.fix_position = new THREE.Vector3(0, 0, 0)

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

		// @ts-ignore
		this.mesh = textMesh
		// FIXME: This will error if there is no Project loaded.
		Project!.nodes_3d[el.uuid] = textMesh

		void getVanillaFont().then(() => {
			// Minecraft's transparency is funky 😭
			textMesh.renderOrder = -1

			const outline = new THREE.LineSegments(
				new THREE.EdgesGeometry(el.textGeo),
				Canvas.outlineMaterial
			)
			outline.add(
				new THREE.LineSegments(new THREE.EdgesGeometry(el.textGeo), Canvas.outlineMaterial)
			)
			// @ts-ignore
			outline.no_export = true
			outline.name = el.uuid + '_outline'
			outline.visible = el.selected
			outline.renderOrder = 2
			outline.frustumCulled = false

			// @ts-ignore
			textMesh.isElement = true
			textMesh.name = el.uuid
			// @ts-ignore
			textMesh.type = el.type
			textMesh.visible = el.visibility
			textMesh.rotation.order = 'ZYX'
			// @ts-ignore
			textMesh.outline = outline
			textMesh.add(outline)

			el.loadingMesh.visible = false
			el.ready = true

			PREVIEW_CONTROLLER.updateTransform(el)
			PREVIEW_CONTROLLER.dispatchEvent('setup', { element: el })
		})
	},
	updateGeometry(el: TextDisplay) {
		void el.updateText()
	},
})

export const CREATE_ACTION = createAction(`${PACKAGE.name}:create_text_display`, {
	name: 'Add Text Display',
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
}
TextDisplayAnimator.prototype.type = TextDisplay.type
TextDisplay.animator = TextDisplayAnimator as any

createBlockbenchMod(
	`${PACKAGE.name}:textDisplay`,
	undefined,
	() => {
		Interface.Panels.outliner.menu.addAction(CREATE_ACTION, 3)
		Toolbars.outliner.add(CREATE_ACTION, 0)
		MenuBar.menus.edit.addAction(CREATE_ACTION, 8)
	},
	() => {
		Interface.Panels.outliner.menu.removeAction(CREATE_ACTION.id)
		Toolbars.outliner.remove(CREATE_ACTION)
		MenuBar.menus.edit.removeAction(CREATE_ACTION.id)
	}
)
