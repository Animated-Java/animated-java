import { ajModelFormat, convertToAJModelFormat } from '../modelFormat'
import { createBlockbenchMod } from '../util/moddingTools'
// Cube.all[0].mesh.material = Canvas.wireframeMaterial

createBlockbenchMod(
	'animated_java:modelFormat',
	{
		convertTo: ModelFormat.prototype.convertTo,
	},
	context => {
		ModelFormat.prototype.convertTo = function (this: ModelFormat) {
			const result = context.convertTo.call(this)
			if (this === ajModelFormat) {
				convertToAJModelFormat()
			}
			return result
		}

		return context
	},
	context => {
		ModelFormat.prototype.convertTo = context.convertTo
	}
)
