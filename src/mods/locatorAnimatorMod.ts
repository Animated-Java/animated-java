import { BLUEPRINT_FORMAT } from '../blueprintFormat'
import { events } from '../util/events'
import { translate } from '../util/translation'

const DEFAULT_SHOW_MOTION_TRAIL = Animator.showMotionTrail
const DEFAULT_PREVIEW = Animator.preview
const DEFAULT_UPDATE_SELECTION = globalThis.updateSelection
const DEFAULT_SELECT = Locator.prototype.select

export class LocatorAnimator extends BoneAnimator {
	private _name: string

	public uuid: string
	public element: Locator | undefined

	constructor(uuid: string, animation: _Animation, name: string) {
		super(uuid, animation, name)
		this.uuid = uuid
		this._name = name
	}

	getElement() {
		this.element = OutlinerNode.uuids[this.uuid] as Locator
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

		if (this.element.selected !== true && this.element) {
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

	displayPosition(arr?: ArrayVector3, multiplier = 1) {
		const bone = this.element!.mesh
		if (arr) {
			bone.position.x -= arr[0] * multiplier
			bone.position.y += arr[1] * multiplier
			bone.position.z += arr[2] * multiplier
		}
		return this
	}

	interpolate(): ArrayVector3 {
		return [0, 0, 0]
	}

	displayFrame() {
		if (!this.doRender()) return
		this.getElement()
	}

	showMotionTrail() {
		return
	}
}
LocatorAnimator.prototype.type = 'locator'
LocatorAnimator.prototype.channels = {
	commands: {
		name: translate('effect_animator.timeline.commands'),
		mutable: true,
		transform: true,
		max_data_points: 1,
	},
}

let installed = false

function inject() {
	if (installed) return

	Locator.animator = LocatorAnimator as any

	Animator.showMotionTrail = function (target?: Group) {
		if (!target || target instanceof Locator) return
		DEFAULT_SHOW_MOTION_TRAIL(target)
	}
	Animator.preview = function (inLoop?: boolean) {
		DEFAULT_PREVIEW(inLoop)
		if (
			Mode.selected.id === Modes.options.animate.id &&
			Outliner.selected[0] instanceof Locator
		) {
			// @ts-ignore
			Canvas.gizmos[0].visible = false
			Transformer.visible = false
		}
	}
	globalThis.updateSelection = function () {
		DEFAULT_UPDATE_SELECTION()
		if (
			Mode.selected.id === Modes.options.animate.id &&
			Outliner.selected[0] instanceof Locator
		) {
			// @ts-ignore
			Canvas.gizmos[0].visible = false
			Transformer.visible = false
		}
	}
	Locator.prototype.select = function (this: Locator, event?: any, isOutlinerClick?: boolean) {
		const result = DEFAULT_SELECT.call(this, event, isOutlinerClick)
		if (Animator.open && Blockbench.Animation.selected) {
			Blockbench.Animation.selected.getBoneAnimator().select()
		}
		return result
	}

	installed = true
}

function extract() {
	if (!installed) return
	Locator.animator = undefined

	Animator.showMotionTrail = DEFAULT_SHOW_MOTION_TRAIL
	Animator.preview = DEFAULT_PREVIEW
	globalThis.updateSelection = DEFAULT_UPDATE_SELECTION
	Locator.prototype.select = DEFAULT_SELECT

	installed = false
}

events.PRE_SELECT_PROJECT.subscribe(project => {
	if (project.format.id === BLUEPRINT_FORMAT.id) {
		inject()
	} else {
		extract()
	}
})
