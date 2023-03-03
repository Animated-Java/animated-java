import { ajModelFormat } from '../modelFormat'
import { createBlockbenchMod } from '../util/moddingTools'
import { applyModelVariant, clearModelVariant } from '../variants'

createBlockbenchMod(
	'animated_java:modes.select',
	{
		originalEditSelect: Modes.options.edit.onSelect,
		originalEditUnselect: Modes.options.edit.onUnselect,
	},
	context => {
		Modes.options.edit.onSelect = function (this: Mode) {
			if (
				Project &&
				Format === ajModelFormat &&
				Project.animated_java_variants &&
				Project.animated_java_variants.selectedVariant
			) {
				applyModelVariant(Project.animated_java_variants.selectedVariant)
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
				clearModelVariant()
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
