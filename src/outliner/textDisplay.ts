// createBlockbenchMod(
// 	`${PACKAGE.name}:textDisplay`,
// 	{},
// 	context => {
// 		return context
// 	},
// 	context => {
// 		// @ts-ignore
// 		delete globalThis.TextDisplay
// 	}
// )

import { isCurrentFormat } from '../blueprintFormat'
import { PACKAGE } from '../constants'
import { createAction } from '../util/moddingTools'
// import * as MinecraftFull from '../assets/MinecraftFull.json'
import TextDisplayLoading from '../assets/text_display_loading.webp'
import { getVanillaFont } from '../systems/minecraft/fontManager'
import { JsonText } from '../systems/minecraft/jsonText'

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

const TEXT_SCALE = 4

export class TextDisplay extends OutlinerElement {
	static type = `${PACKAGE.name}:text_display`

	public type = `${PACKAGE.name}:text_display`
	public icon = 'text_fields'
	public movable = true
	public rotatable = true
	public scalable = true
	public needsUniqueName = true

	// Properties
	public name: string
	public text: string
	public position: ArrayVector3
	public rotation: ArrayVector3
	public scale: ArrayVector3
	public lineWidth: number
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

	constructor(data: TextDisplayOptions, uuid = guid()) {
		super(data, uuid)

		this.texture.magFilter = THREE.NearestFilter
		this.texture.minFilter = THREE.NearestFilter

		for (const key in TextDisplay.properties) {
			TextDisplay.properties[key].reset(this)
		}

		this.extend(data)

		this.name ??= 'Text Display'
		this.text ??= 'Hello World!'
		this.position ??= [0, 0, 0]
		this.rotation ??= [0, 0, 0]
		this.scale ??= [1, 1, 1]
		this.lineWidth ??= 200
		this.backgroundColor ??= '#000000'
		this.backgroundAlpha ??= 0.25
		this.align ??= 'center'
		this.visibility ??= true

		this.sanitizeName()
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

	select(event?: any, isOutlinerClick?: boolean) {
		super.select(event, isOutlinerClick)
		if (Animator.open && Blockbench.Animation.selected) {
			Blockbench.Animation.selected.getBoneAnimator(this).select()
		}
		return this
	}

	unselect() {
		super.unselect()
		if (
			Animator.open &&
			Timeline.selected_animator &&
			Timeline.selected_animator.element === this
		) {
			Timeline.selected = false
		}
	}

	async setText(jsonText: JsonText) {
		console.log(jsonText.toString())
		const font = await getVanillaFont()
		const ctx = this.canvas.getContext('2d', { willReadFrequently: true })!
		console.time('drawTextToCanvas')
		await font.drawTextToCanvas({
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
		console.timeEnd('drawTextToCanvas')
		this.texture.needsUpdate = true

		this.textGeo.scale(
			this.canvas.width / TEXT_SCALE / 2.5,
			this.canvas.height / TEXT_SCALE / 2.5,
			1
		)
	}
}
new Property(TextDisplay, 'string', 'text', { default: '"Hello World!"' })
new Property(TextDisplay, 'vector', 'position', { default: [0, 0, 0] })
new Property(TextDisplay, 'vector', 'rotation', { default: [0, 0, 0] })
new Property(TextDisplay, 'vector', 'scale', { default: [1, 1, 1] })
new Property(TextDisplay, 'number', 'lineLength', { default: 200 / 4 })
new Property(TextDisplay, 'string', 'backgroundColor', { default: '#000000' })
new Property(TextDisplay, 'number', 'backgroundAlpha', { default: 0.25 })
new Property(TextDisplay, 'string', 'align', { default: 'center' })
new Property(TextDisplay, 'string', 'visibility', { default: true })
OutlinerElement.registerType(TextDisplay, TextDisplay.type)

export const PREVIEW_CONTROLLER = new NodePreviewController(TextDisplay, {
	setup(el: TextDisplay) {
		el.textGeo = new THREE.PlaneGeometry(1, 1)
		el.textGeo.rotateY(Math.PI)
		let loaded = false

		const material = new THREE.MeshBasicMaterial({ map: el.texture, transparent: true })
		const textMesh = new THREE.Mesh(el.textGeo, material)
		let loadingMesh: THREE.Mesh
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
			loadingMesh = new THREE.Mesh(loadingGeo, loadingMaterial)
			textMesh.add(loadingMesh)
			loadingMesh.visible = !loaded
		})

		// @ts-ignore
		this.mesh = textMesh
		// FIXME: This will error if there is no Project loaded.
		Project!.nodes_3d[el.uuid] = textMesh

		void getVanillaFont().then(async () => {
			let text: JsonText | undefined
			try {
				text = JsonText.fromString(el.text + 'awd')
			} catch (e: any) {
				console.error('Failed to parse JsonText:', e)
			}
			if (text) {
				await el.setText(text)
			}

			textMesh.renderOrder = 1
			el.textGeo.center()
			el.textGeo.computeBoundingBox()
			const box = el.textGeo.boundingBox
			el.textGeo.translate(-1 / 5, -box!.min.y, 0)

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

			loaded = true
			if (loadingMesh) {
				loadingMesh.visible = !loaded
			}

			PREVIEW_CONTROLLER.updateTransform(el)
			PREVIEW_CONTROLLER.dispatchEvent('setup', { element: el })
		})
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

		if (group) {
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

Interface.Panels.outliner.menu.addAction(CREATE_ACTION, 3)
Toolbars.outliner.add(CREATE_ACTION, 0)
MenuBar.menus.edit.addAction(CREATE_ACTION, 8)
