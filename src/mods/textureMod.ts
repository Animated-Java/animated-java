import { ajModelFormat } from '../modelFormat'
import { createBlockbenchMod } from '../util/moddingTools'
import { TextureId } from '../variants'

declare global {
	interface Texture {
		toTextureId(): TextureId
	}
}

createBlockbenchMod(
	'animated_java:texture_toTextureId',
	{
		remove: Texture.prototype.remove,
	},
	context => {
		Texture.prototype.toTextureId = function (this: Texture) {
			return `${this.uuid}::${this.name}`
		}
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
		// @ts-ignore
		delete Texture.prototype.toTextureId
		Texture.prototype.remove = context.remove
	}
)
