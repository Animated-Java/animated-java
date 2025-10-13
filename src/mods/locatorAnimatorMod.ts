import { activeProjectIsBlueprintFormat, BLUEPRINT_FORMAT_ID } from 'src/formats/blueprint'
import EVENTS from 'src/util/events'
import { registerConditionalPropertyOverrideMod, registerProjectMod } from 'src/util/moddingTools'
import { translate } from '../util/translation'

export class LocatorAnimator extends BoneAnimator {
	uuid: string
	element: Locator | undefined

	constructor(uuid: string, animation: _Animation, name: string) {
		super(uuid, animation, name)
		this.uuid = uuid
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
	function: {
		name: translate('effect_animator.timeline.function'),
		mutable: true,
		transform: true,
		max_data_points: 1,
	},
}

registerConditionalPropertyOverrideMod({
	id: 'animated-java:property-override/locator/animator',
	object: Locator,
	key: 'animator',

	condition: () => activeProjectIsBlueprintFormat(),

	get: () => {
		return LocatorAnimator as unknown as BoneAnimator
	},
})

registerConditionalPropertyOverrideMod({
	id: 'animated-java:function-override/locator/select',
	object: Locator.prototype,
	key: 'select',

	condition: () => activeProjectIsBlueprintFormat(),

	get: original => {
		return function (this: Locator, event?: any, isOutlinerClick?: boolean) {
			const result = original.call(this, event, isOutlinerClick)
			if (Animator.open && Blockbench.Animation.selected) {
				Blockbench.Animation.selected.getBoneAnimator().select()
			}
			return result
		}
	},
})

registerConditionalPropertyOverrideMod({
	id: 'animated-java:function-override/animator/show-motion-trail',
	object: Animator,
	key: 'showMotionTrail',

	condition: () => activeProjectIsBlueprintFormat(),

	get: original => {
		return function (target?: Group) {
			if (!target || target instanceof Locator) return
			return original(target)
		}
	},
})

registerConditionalPropertyOverrideMod({
	id: 'animated-java:function-override/animator/preview',
	object: Animator,
	key: 'preview',

	condition: () => activeProjectIsBlueprintFormat(),

	get: original => {
		return function (inLoop?: boolean) {
			const result = original(inLoop)
			if (
				Mode.selected.id === Modes.options.animate.id &&
				Outliner.selected[0] instanceof Locator
			) {
				Canvas.gizmos[0].visible = false
				Transformer.visible = false
			}
			return result
		}
	},
})

registerProjectMod({
	id: 'animated-java:project-mod/locator-animator/hide-gizmos',

	condition: project => project.format.id === BLUEPRINT_FORMAT_ID,

	apply: () => {
		const unsub = EVENTS.UPDATE_SELECTION.subscribe(() => {
			if (Mode.selected.id !== Modes.options.animate.id) return
			if (selected.at(0) instanceof Locator) {
				Canvas.gizmos[0].visible = false
				Transformer.visible = false
			}
		})
		return { unsub }
	},

	revert: ({ unsub }) => {
		unsub()
	},
})
