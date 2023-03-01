import { ajModelFormat } from '../modelFormat'
import { BlockbenchMod } from '../util/mods'
import { applyModelVariant, clearModelVariant } from '../variants'

new BlockbenchMod({
	id: 'animated_java:modes.select',
	context: {
		originalEditSelect: Modes.options.edit.onSelect,
		originalEditUnselect: Modes.options.edit.onUnselect,
	},
	inject(context) {
		Modes.options.edit.onSelect = function (this: Mode) {
			if (
				Project &&
				Format.id === ajModelFormat.id &&
				Project.animated_java_variants &&
				Project.animated_java_variants.selectedVariant
			) {
				applyModelVariant(Project.animated_java_variants.selectedVariant!)
			}
			return context.originalEditSelect?.call(this)
		}
		Modes.options.edit.onUnselect = function () {
			if (
				Project &&
				Format.id === ajModelFormat.id &&
				Project.animated_java_variants &&
				Project.animated_java_variants.selectedVariant
			) {
				clearModelVariant()
			}
			return context.originalEditUnselect?.call(this)
		}
	},
	extract(context) {
		Modes.options.edit.onSelect = context.originalEditSelect
		Modes.options.edit.onUnselect = context.originalEditUnselect
	},
})
