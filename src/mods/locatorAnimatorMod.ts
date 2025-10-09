import { BLUEPRINT_FORMAT_ID } from 'src/formats/blueprint/format'
import { registerProjectMod } from 'src/util/moddingTools'
import { translate } from '../util/translation'

export class LocatorAnimator extends BoneAnimator {
	private __name: string

	public uuid: string
	public element: Locator | undefined

	constructor(uuid: string, animation: _Animation, name: string) {
		super(uuid, animation, name)
		this.uuid = uuid
		this.__name = name
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

		if (this.element?.parent && this.element.parent !== 'root') {
			this.element.parent.openUp()
		}

		return this
	}

	doRender() {
		this.getElement()
		return !!this.element?.mesh
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

registerProjectMod({
	id: 'animated-java:locator-animator',

	condition: project => project.format.id === BLUEPRINT_FORMAT_ID,

	apply: () => {
		Locator.animator = LocatorAnimator as any

		const originalShowMotionTrail = Animator.showMotionTrail
		Animator.showMotionTrail = function (target?: Group) {
			if (!target || target instanceof Locator) return
			originalShowMotionTrail(target)
		}

		const originalPreview = Animator.preview
		Animator.preview = function (inLoop?: boolean) {
			originalPreview(inLoop)
			if (
				Mode.selected.id === Modes.options.animate.id &&
				Outliner.selected[0] instanceof Locator
			) {
				// @ts-ignore
				Canvas.gizmos[0].visible = false
				Transformer.visible = false
			}
		}

		const originalUpdateSelection = globalThis.updateSelection
		globalThis.updateSelection = function () {
			originalUpdateSelection()
			if (
				Mode.selected.id === Modes.options.animate.id &&
				Outliner.selected[0] instanceof Locator
			) {
				// @ts-ignore
				Canvas.gizmos[0].visible = false
				Transformer.visible = false
			}
		}

		const originalSelect = Locator.prototype.select
		Locator.prototype.select = function (
			this: Locator,
			event?: any,
			isOutlinerClick?: boolean
		) {
			const result = originalSelect.call(this, event, isOutlinerClick)
			if (Animator.open && Blockbench.Animation.selected) {
				Blockbench.Animation.selected.getBoneAnimator().select()
			}
			return result
		}

		return {
			originalShowMotionTrail,
			originalPreview,
			originalUpdateSelection,
			originalSelect,
		}
	},

	revert: ({
		originalShowMotionTrail,
		originalPreview,
		originalUpdateSelection,
		originalSelect,
	}) => {
		Locator.animator = undefined

		Animator.showMotionTrail = originalShowMotionTrail
		Animator.preview = originalPreview
		globalThis.updateSelection = originalUpdateSelection
		Locator.prototype.select = originalSelect
	},
})
