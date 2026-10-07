import { registerPatch, registerPropertyOverridePatch } from 'blockbench-patch-manager'
import { openAnimationPropertiesDialog } from '../dialogs/animationProperties/animationProperties'
import { activeProjectIsBlueprintFormat } from '../formats/blueprint'
import { localize as translate } from '../util/lang'
import { roundToNth } from '../util/misc'

declare global {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface _Animation {
		excluded_nodes: CollectionItem[]
		/** Variant UUIDs applied, in order, before previewing the animation. Editor only. */
		preview_variants: string[]
		/** Slot UUID -> texture UUID set before previewing the animation. Editor only. */
		preview_texture_slots: Record<string, string>
	}

	interface AnimationUndoCopy {
		excluded_nodes: string[]
		preview_variants: string[]
		preview_texture_slots: Record<string, string>
	}

	interface AnimationOptions {
		excluded_nodes: string[]
		preview_variants: string[]
		preview_texture_slots: Record<string, string>
	}
}

export const DEFAULT_SNAPPING_VALUE = 20
export const MINIMUM_ANIMATION_LENGTH = 0.05

//region Extend
registerPropertyOverridePatch({
	id: `animated_java:function-override/animation/extend`,
	target: Blockbench.Animation.prototype,
	key: 'extend',

	getCondition: () => activeProjectIsBlueprintFormat(),

	get: original => {
		return function (this: _Animation, data?: AnimationOptions) {
			original.call(this, data)
			this.snapping = DEFAULT_SNAPPING_VALUE
			this.length = Math.max(this.length, MINIMUM_ANIMATION_LENGTH)
			for (const animator of Object.values(this.animators)) {
				if (!animator) continue
				let lastTime = -Infinity
				for (const kf of animator.keyframes) {
					let rounded = roundToNth(kf.time, DEFAULT_SNAPPING_VALUE)
					if (rounded === kf.time) continue
					if (rounded === lastTime) rounded += 0.05
					kf.time = rounded
					lastTime = rounded
				}
			}
			return this
		}
	},
})

//region Set Length
registerPropertyOverridePatch({
	id: `animated_java:function-override/animation/set-length`,
	target: Blockbench.Animation.prototype,
	key: 'setLength',

	getCondition: () => activeProjectIsBlueprintFormat(),

	get: original => {
		return function (this: _Animation, length?: number) {
			length = Math.max(length ?? this.length, MINIMUM_ANIMATION_LENGTH)
			return original.call(this, length)
		}
	},
})

//region Properties Dialog
registerPropertyOverridePatch({
	id: `animated_java:function-override/animation/properties-dialog`,
	target: Blockbench.Animation.prototype,
	key: 'propertiesDialog',

	getCondition: () => activeProjectIsBlueprintFormat(),

	get: () => {
		return function (this: _Animation) {
			if (!Blockbench.Animation.selected) {
				Blockbench.showQuickMessage('No animation selected')
				return
			}
			openAnimationPropertiesDialog(Blockbench.Animation.selected)
		}
	},
})

//region Properties
registerPatch({
	id: `animated_java:property-definitions/animation`,

	apply: () => {
		const excludedNodesProperty = new Property(
			Blockbench.Animation,
			'array',
			'excluded_nodes',
			{
				condition: () => activeProjectIsBlueprintFormat(),
				label: translate('animation.excluded_nodes'),
				default: [],
			}
		)

		const previewVariantsProperty = new Property(
			Blockbench.Animation,
			'array',
			'preview_variants',
			{
				condition: () => activeProjectIsBlueprintFormat(),
				default: [],
			}
		)

		const previewTextureSlotsProperty = new Property(
			Blockbench.Animation,
			'object',
			'preview_texture_slots',
			{
				condition: () => activeProjectIsBlueprintFormat(),
				default: {},
			}
		)

		return { excludedNodesProperty, previewVariantsProperty, previewTextureSlotsProperty }
	},

	revert: ({ excludedNodesProperty, previewVariantsProperty, previewTextureSlotsProperty }) => {
		excludedNodesProperty.delete()
		previewVariantsProperty.delete()
		previewTextureSlotsProperty.delete()
	},
})

//region Force Saved
registerPropertyOverridePatch({
	id: `animated_java:animation-force-saved`,
	target: Blockbench.Animation.prototype,
	key: 'saved',

	getCondition: () => activeProjectIsBlueprintFormat(),

	get: () => true,

	set: () => true,
})

//region Save All Action
registerPropertyOverridePatch({
	id: `animated_java:action-condition-override/save-all-animations`,
	target: BarItems.save_all_animations as Action,
	key: 'condition',

	getCondition: () => activeProjectIsBlueprintFormat(),

	get: () => false,
})
