import { BLUEPRINT_FORMAT, convertToBlueprint } from '../blueprintFormat'
import { PACKAGE } from '../constants'
import { createBlockbenchMod } from '../util/moddingTools'

createBlockbenchMod(
	`${PACKAGE.name}:modelFormatConvertToMod`,
	{
		original: ModelFormat.prototype.convertTo,
	},
	context => {
		ModelFormat.prototype.convertTo = function (this: ModelFormat) {
			const result = context.original.call(this)
			if (this === BLUEPRINT_FORMAT) convertToBlueprint()
			return result
		}
		return context
	},
	context => {
		ModelFormat.prototype.convertTo = context.original
	}
)
