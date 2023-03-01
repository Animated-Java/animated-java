import { ajModelFormat } from '../modelFormat'
import { BlockbenchMod } from '../util/mods'
import { TextureId } from '../variants'

declare global {
	interface Texture {
		toTextureId(): TextureId
	}
}

new BlockbenchMod({
	id: 'animated_java:texture.toTextureId',
	context: {
		original: Texture.prototype.remove,
	},
	inject(context) {
		Texture.prototype.toTextureId = function (this: Texture) {
			return `${this.uuid}::${this.name}`
		}
		Texture.prototype.remove = function (this: Texture) {
			if (!Project) return
			const x = context.original.call(this)
			// Remove all texture mappings that use this texture
			if (Format.id === ajModelFormat.id) {
				Project.animated_java_variants!.verifyTextures(true)
			}
			return x
		}
	},
	extract(context) {
		// @ts-ignore
		delete Texture.prototype.toTextureId
		Texture.prototype.remove = context.original
	},
})
