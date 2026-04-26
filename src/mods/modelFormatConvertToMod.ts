import { registerPatch } from 'blockbench-patch-manager'
import { BLUEPRINT_FORMAT_ID, convertToBlueprint } from '../formats/blueprint'

registerPatch({
	id: `animated_java:model-format-convert-to-mod`,

	apply: () => {
		const original = ModelFormat.prototype.convertTo

		ModelFormat.prototype.convertTo = function (this: ModelFormat) {
			const result = original.call(this)
			if (this.id === BLUEPRINT_FORMAT_ID) convertToBlueprint()
			return result
		}

		return { original }
	},

	revert: ({ original }) => {
		ModelFormat.prototype.convertTo = original
	},
})
