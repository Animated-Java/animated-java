import { BLUEPRINT_FORMAT, convertToBlueprint } from '../blueprintFormat'
import { registerMod } from '../util/moddingTools'

registerMod({
	id: `animated-java:model-format-convert-to-mod`,

	apply: () => {
		const original = ModelFormat.prototype.convertTo

		ModelFormat.prototype.convertTo = function (this: ModelFormat) {
			const result = original.call(this)
			if (this === BLUEPRINT_FORMAT) convertToBlueprint()
			return result
		}

		return { original }
	},

	revert: ({ original }) => {
		ModelFormat.prototype.convertTo = original
	},
})
