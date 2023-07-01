import { ajModelFormat } from '../modelFormat'
import { createBlockbenchMod } from '../util/moddingTools'
import { Variant } from '../variants'
import * as events from '../events'

createBlockbenchMod(
	'animated_java:modes.edit/variants',
	{
		originalEditSelect: Modes.options.edit.onSelect,
		originalEditUnselect: Modes.options.edit.onUnselect,
	},
	context => {
		let selectedVariant: Variant
		Modes.options.edit.onSelect = function (this: Mode) {
			if (
				Project &&
				Format === ajModelFormat &&
				Project.animated_java_variants &&
				Project.animated_java_variants.selectedVariant
			) {
				if (selectedVariant) Project.animated_java_variants.select(selectedVariant)
				events.UPDATE_SELECTION.dispatch()
			}
			return context.originalEditSelect?.call(this)
		}
		Modes.options.edit.onUnselect = function () {
			if (
				Project &&
				Format === ajModelFormat &&
				Project.animated_java_variants &&
				Project.animated_java_variants.selectedVariant
			) {
				selectedVariant = Project.animated_java_variants.selectedVariant
				Project.animated_java_variants.select()
				events.UPDATE_SELECTION.dispatch()
			}
			return context.originalEditUnselect?.call(this)
		}
		return context
	},
	context => {
		Modes.options.edit.onSelect = context.originalEditSelect
		Modes.options.edit.onUnselect = context.originalEditUnselect
	}
)

createBlockbenchMod(
	'animated_java:modes.paint/variants',
	{
		originalSelect: Modes.options.paint.onSelect,
		originalUnselect: Modes.options.paint.onUnselect,
	},
	context => {
		let selectedVariant: Variant | undefined
		Modes.options.paint.onSelect = function (this: Mode) {
			if (Project && Format === ajModelFormat) {
				requestAnimationFrame(() => {
					selectedVariant = Project.animated_java_variants?.selectedVariant
					Project.animated_java_variants?.select()
					// console.log(Project.animated_java_variants?.selectedVariant?.name)
				})
			}
			return context.originalSelect?.call(this)
		}
		Modes.options.paint.onUnselect = function () {
			if (Project && Format === ajModelFormat && Project.animated_java_variants) {
				Project.animated_java_variants.select(selectedVariant)
				// console.log(Project.animated_java_variants.selectedVariant?.name)
			}
			return context.originalUnselect?.call(this)
		}
		return context
	},
	context => {
		Modes.options.paint.onSelect = context.originalSelect
		Modes.options.paint.onUnselect = context.originalUnselect
	}
)
