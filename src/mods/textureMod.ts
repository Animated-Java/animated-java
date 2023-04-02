import { ajModelFormat } from '../modelFormat'
import { createBlockbenchMod } from '../util/moddingTools'

createBlockbenchMod(
	'animated_java:texture',
	{
		remove: Texture.prototype.remove,
	},
	context => {
		Texture.prototype.remove = function (this: Texture) {
			if (!Project?.animated_java_variants) return
			const x = context.remove.call(this)
			// Remove all texture mappings that use this texture
			if (Format === ajModelFormat) {
				Project.animated_java_variants.verifyTextures(true)
			}
			return x
		}
		return context
	},
	context => {
		Texture.prototype.remove = context.remove
	}
)
