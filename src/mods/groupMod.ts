import { safeFunctionName } from '../minecraft'
import { ajModelFormat } from '../modelFormat'
import { createBlockbenchMod } from '../util/moddingTools'

createBlockbenchMod(
	'animated_java:group/force_valid_function_name',
	{
		original: Group.prototype.createUniqueName,
	},
	context => {
		Group.prototype.createUniqueName = function (this: Group, others?: Group[]) {
			if (Format === ajModelFormat) {
				this.name = safeFunctionName(this.name)
			}
			return context.original.call(this, others)
		}
		return context
	},
	context => {
		Group.prototype.createUniqueName = context.original
	}
)
