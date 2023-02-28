import { BlockbenchMod } from '../util/mods'
import { TextureId } from '../variants'

declare global {
	interface Texture {
		toTextureId(): TextureId
	}
}

new BlockbenchMod({
	id: 'animated_java:texture.toTextureId',
	inject(context) {
		Texture.prototype.toTextureId = function (this: Texture) {
			return `${this.uuid}::${this.name}`
		}
	},
	extract(context) {
		// @ts-ignore
		delete Texture.prototype.toTextureId
	},
})
