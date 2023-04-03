import { safeFunctionName } from '../minecraft'
import { ajModelFormat } from '../modelFormat'
import { createBlockbenchMod } from '../util/moddingTools'

createBlockbenchMod(
	'animated_java:outlinerNode/force_valid_function_name',
	{
		createUniqueName: OutlinerNode.prototype.createUniqueName,
	},
	context => {
		OutlinerNode.prototype.createUniqueName = function (
			this: OutlinerNode,
			others?: OutlinerNode[]
		) {
			if (Format === ajModelFormat) {
				this.name = safeFunctionName(this.name)
			}
			return context.createUniqueName.call(this, others)
		}
		return context
	},
	context => {
		OutlinerNode.prototype.createUniqueName = context.createUniqueName
	}
)
