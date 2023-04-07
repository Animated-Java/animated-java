import { ajModelFormat } from '../modelFormat'
import { createBlockbenchMod } from '../util/moddingTools'

createBlockbenchMod(
	'animated_java:texture',
	{
		remove: Texture.prototype.remove,
	},
	context => {
		Texture.prototype.remove = function (this: Texture) {
			const x = context.remove.call(this)
			// Remove all texture mappings that use this texture
			if (Format === ajModelFormat) {
				Project!.animated_java_variants!.verifyTextures(true)
			}
			return x
		}
		// I'm lazy 🤪
		// const interval = setInterval(() => {
		// 	if (Format === ajModelFormat) {
		// 		const maxTextureWidth = Texture.all.reduce(
		// 			(max, texture) => Math.max(max, texture.width),
		// 			0
		// 		)
		// 		Project!.texture_height = maxTextureWidth
		// 		Project!.texture_width = maxTextureWidth
		// 	}
		// }, 1000)
		return {
			// interval,
			...context,
		}
	},
	context => {
		// clearInterval(context.interval)
		Texture.prototype.remove = context.remove
	}
)
