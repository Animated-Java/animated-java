import { registerAction } from 'src/util/moddingTools'
import { PACKAGE } from '../constants'
import { type IBlueprintBoneConfigJSON, activeProjectIsBlueprintFormat } from '../formats/blueprint'
import { BoneConfig } from '../nodeConfigs'
import { BlockModelMesh, getBlockModel } from '../systems/minecraft/blockModelManager'
import { type BlockStateValue, getBlockState } from '../systems/minecraft/blockstateManager'
import { MINECRAFT_REGISTRY } from '../systems/minecraft/registryManager'
import { getCurrentVersion } from '../systems/minecraft/versionManager'
import EVENTS from '../util/events'
import { parseBlock } from '../util/minecraftUtil'
import { Valuable } from '../util/stores'
import { translate } from '../util/translation'
import { ResizableOutlinerElement } from './resizableOutlinerElement'
import { sanitizeOutlinerElementName } from './util'

const ERROR_OUTLINE_MATERIAL = Canvas.outlineMaterial.clone()
ERROR_OUTLINE_MATERIAL.color.set('#ff0000')

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
	static icon = 'deployed_code'
	static selected: VanillaBlockDisplay[] = []
	static all: VanillaBlockDisplay[] = []

	type = VanillaBlockDisplay.type
	icon = VanillaBlockDisplay.icon
	needsUniqueName = true

	// Properties
	private __block = new Valuable('minecraft:stone')
	config: IBlueprintBoneConfigJSON

	error = new Valuable('')

	buttons = [Outliner.buttons.export, Outliner.buttons.locked, Outliner.buttons.visibility]
	// eslint-disable-next-line @typescript-eslint/naming-convention
	preview_controller = PREVIEW_CONTROLLER

	constructor(data: VanillaBlockDisplayOptions, uuid = guid()) {
		super(data, uuid)
		VanillaBlockDisplay.all.push(this)

		for (const key in VanillaBlockDisplay.properties) {
			VanillaBlockDisplay.properties[key].reset(this)
		}

		this.name = 'block_display'
		this.extend(data)

		this.block ??= 'minecraft:stone'
		this.config ??= {}

		this.sanitizeName()

		const updateBlock = async (newBlock: string) => {
			if (!MINECRAFT_REGISTRY.block) {
				requestAnimationFrame(() => void updateBlock(newBlock))
				return
			}
			const parsed = await parseBlock(newBlock)
			if (!parsed) {
				this.error.set('Invalid block ID.')
			} else if (
				(parsed.resource.namespace === 'minecraft' || parsed.resource.namespace === '') &&
				MINECRAFT_REGISTRY.block.has(parsed.resource.name)
			) {
				this.error.set('')
				this.preview_controller.updateGeometry(this)
			} else {
				this.error.set(`This block does not exist in Minecraft ${getCurrentVersion()!.id}.`)
			}
			if (this.mesh?.outline instanceof THREE.LineSegments) {
				if (this.error.get()) this.mesh.outline.material = ERROR_OUTLINE_MATERIAL
				else this.mesh.outline.material = Canvas.outlineMaterial
			}
		}

		this.__block.subscribe(value => {
			void updateBlock(value)
		})
	}

	get block() {
		if (this.__block === undefined) return 'minecraft:stone'
		return this.__block.get()
	}
	set block(value: string) {
		if (this.__block === undefined) return
		if (this.block === value) return
		this.__block.set(value)
	}

	sanitizeName(): string {
		this.name = sanitizeOutlinerElementName(this.name, this.uuid)
		return this.name
	}

	getUndoCopy() {
		const copy = {} as VanillaBlockDisplayOptions & { uuid: string; type: string }

		for (const key in VanillaBlockDisplay.properties) {
			VanillaBlockDisplay.properties[key].copy(this, copy)
		}

		copy.uuid = this.uuid
		copy.type = this.type
		return copy
	}

	getSaveCopy() {
		const save = super.getSaveCopy?.() ?? {}
		for (const key in VanillaBlockDisplay.properties) {
			VanillaBlockDisplay.properties[key].copy(this, save)
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

	applyBlockModel(blockModel: BlockModelMesh) {
		const mesh = this.mesh as THREE.Mesh
		mesh.name = this.uuid
		mesh.geometry = blockModel.boundingBox
		mesh.material = Canvas.transparentMaterial

		mesh.clear()
		blockModel.outline.name = this.uuid + '_outline'
		blockModel.outline.visible = this.selected
		mesh.outline = blockModel.outline
		mesh.add(blockModel.mesh)
		mesh.add(blockModel.outline)

		this.preview_controller.updateHighlight(this)
		this.preview_controller.updateTransform(this)
		mesh.visible = this.visibility
		TickUpdates.selection = true
	}
}
VanillaBlockDisplay.prototype.icon = VanillaBlockDisplay.icon
new Property(VanillaBlockDisplay, 'string', 'block', { default: 'minecraft:stone' })
new Property(VanillaBlockDisplay, 'object', 'config', {
	get default() {
		return new BoneConfig().toJSON()
	},
})
OutlinerElement.registerType(VanillaBlockDisplay, VanillaBlockDisplay.type)

const TEMP_MESH_MAP = new THREE.TextureLoader().load(
	'data:image/svg+xml,' +
		encodeURIComponent(
			`<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e3e3e3"><path d="M440-183v-274L200-596v274l240 139Zm80 0 240-139v-274L520-457v274Zm-40-343 237-137-237-137-237 137 237 137ZM160-252q-19-11-29.5-29T120-321v-318q0-22 10.5-40t29.5-29l280-161q19-11 40-11t40 11l280 161q19 11 29.5 29t10.5 40v318q0 22-10.5 40T800-252L520-91q-19 11-40 11t-40-11L160-252Zm320-228Z"/></svg>`
		)
)
TEMP_MESH_MAP.minFilter = THREE.NearestFilter
TEMP_MESH_MAP.magFilter = THREE.NearestFilter

export const PREVIEW_CONTROLLER = new NodePreviewController(VanillaBlockDisplay, {
	setup(el: VanillaBlockDisplay) {
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
	},
	updateGeometry(el: VanillaBlockDisplay) {
		if (!el.mesh) return

		void getBlockModel(el.block)
			.then(result => {
				if (!result?.mesh) return
				el.applyBlockModel(result)
				TickUpdates.selection = true
			})
			.catch(err => {
				console.error(err)
				if (typeof err.message === 'string') {
					el.error.set(err.message as string)
				}
			})
			.finally(() => {
				if (el.mesh?.outline instanceof THREE.LineSegments) {
					if (el.error.get()) el.mesh.outline.material = ERROR_OUTLINE_MATERIAL
					else el.mesh.outline.material = Canvas.outlineMaterial
				}
			})
	},
	updateTransform(el: VanillaBlockDisplay) {
		ResizableOutlinerElement.prototype.preview_controller.updateTransform(el)
	},
	updateHighlight(el: VanillaBlockDisplay, force?: boolean | VanillaBlockDisplay) {
		if (!activeProjectIsBlueprintFormat() || !el?.mesh) return
		const highlighted = Modes.edit && (force === true || force === el || el.selected) ? 1 : 0

		const blockModel = el.mesh.children.at(0) as THREE.Mesh
		if (!blockModel) return
		for (const child of blockModel.children) {
			if (!(child instanceof THREE.Mesh)) continue
			const highlight = child.geometry.attributes.highlight

			if (highlight.array[0] != highlighted) {
				highlight.array.set(Array(highlight.count).fill(highlighted))
				highlight.needsUpdate = true
			}
		}
	},
})

class VanillaBlockDisplayAnimator extends BoneAnimator {
	uuid: string
	element: VanillaBlockDisplay | undefined

	constructor(uuid: string, animation: _Animation, name: string) {
		super(uuid, animation, name)
		this.uuid = uuid
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
VanillaBlockDisplayAnimator.prototype.type = VanillaBlockDisplay.type
VanillaBlockDisplay.animator = VanillaBlockDisplayAnimator as any

export const CREATE_ACTION = registerAction(
	{ id: `animated-java:create-vanilla-block-display` },
	{
		name: translate('action.create_vanilla_block_display.title'),
		icon: 'deployed_code',
		category: 'animated_java',
		condition() {
			return activeProjectIsBlueprintFormat() && Mode.selected.id === Modes.options.edit.id
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
			Group.first_selected?.unselect()
			vanillaBlockDisplay.select()

			Undo.finishEdit('Create Vanilla Block Display', {
				outliner: true,
				elements: selected,
				selection: true,
			})

			return vanillaBlockDisplay
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
			project.vanillaBlockDisplays ??= []
			VanillaBlockDisplay.all.empty()
			VanillaBlockDisplay.all.push(...project.vanillaBlockDisplays)
		}),

		EVENTS.UNSELECT_PROJECT.subscribe(project => {
			project.vanillaBlockDisplays = [...VanillaBlockDisplay.all]
			VanillaBlockDisplay.all.empty()
		})
	)
})

CREATE_ACTION.onDeleted(action => {
	Interface.Panels.outliner.menu.removeAction(action)
	Toolbars.outliner.remove(action)
	MenuBar.menus.edit.removeAction(action)

	CLEANUP_CALLBACKS.forEach(unsub => unsub())
})

export function debugBlocks() {
	const maxX = Math.floor(Math.sqrt(MINECRAFT_REGISTRY.block.items.length))
	for (let i = 0; i < MINECRAFT_REGISTRY.block.items.length; i++) {
		const block = MINECRAFT_REGISTRY.block.items[i]
		const x = (i % maxX) * 32
		const y = Math.floor(i / maxX) * 32
		new VanillaBlockDisplay({ name: block, block, position: [x, 8, y] }).init()
	}
}

export async function debugBlockState(block: string) {
	const blockState = await getBlockState(block)
	if (!blockState) return

	const permutations = computeAllStatePermutations(blockState.stateValues)

	const maxX = Math.floor(Math.sqrt(permutations.length))
	for (let i = 0; i < permutations.length; i++) {
		const x = (i % maxX) * 32
		const y = Math.floor(i / maxX) * 32
		const str = generateBlockStateString(permutations[i])
		new VanillaBlockDisplay({
			name: block + str,
			block: block + str,
			position: [x, 8, y],
		}).init()
	}
}

function generateBlockStateString(state: Record<string, BlockStateValue>) {
	const str = Object.entries(state).map(([k, v]) => `${k}=${v.toString()}`)
	return `[${str.join(',')}]`
}

// FetchBot is the GOAT 🐐
function computeAllStatePermutations(state: Record<string, BlockStateValue[]>) {
	const maxPermutation = Object.values(state).reduce((acc, cur) => acc * cur.length, 1)
	const permutations: Array<Record<string, string>> = []
	for (let i = 0; i < maxPermutation; i++) {
		const permutation: Record<string, string> = {}
		let i2 = i
		Object.entries(state).forEach(([key, value]) => {
			const index = i2 % value.length
			permutation[key] = String(value[index])
			i2 = Math.floor(i2 / value.length)
		})
		permutations.push(permutation)
	}
	return permutations
}
