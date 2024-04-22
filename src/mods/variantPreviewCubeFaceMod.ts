import { isCurrentFormat } from '../blueprintFormat'
import { PACKAGE } from '../constants'
import { createBlockbenchMod } from '../util/moddingTools'
import { Variant } from '../variants'

createBlockbenchMod(
	`${PACKAGE.name}:variantPreviewCubeFace`,
	{
		originalGetTexture: CubeFace.prototype.getTexture,
	},
	context => {
		CubeFace.prototype.getTexture = function (this: CubeFace): Texture | undefined {
			if (isCurrentFormat() && this.texture) {
				const variant = Variant.selected
				if (
					variant &&
					this.cube.parent instanceof Group &&
					!variant.excludedBones.find(
						v => v.value === (this.cube.parent as Group).uuid
					) &&
					variant.textureMap.has(this.texture)
				) {
					return variant.textureMap.getMappedTexture(this.texture)
				}
			}
			return context.originalGetTexture.call(this)
		}
		return context
	},
	context => {
		CubeFace.prototype.getTexture = context.originalGetTexture
	}
)
