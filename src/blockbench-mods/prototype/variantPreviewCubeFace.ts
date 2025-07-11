import { isCurrentFormat } from '../../blockbench-additions/model-formats/ajblueprint'
import { PACKAGE } from '../../constants'
import { createBlockbenchMod } from '../../util/moddingTools'
import { Variant } from '../../variants'

/**
 * Swaps out the texture of a cube face with the variant texture based on the currently selected variant
 */
createBlockbenchMod(
	`${PACKAGE.name}:mods/prototype/variantPreviewCubeFace`,
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
					!variant.excludedNodes.find(
						v => v.value === (this.cube.parent as Group).uuid
					) &&
					variant.textureMap.has(this.texture)
				) {
					this.lastVariant = variant
					return variant.textureMap.getMappedTexture(this.texture)
				} else if (
					Mode.selected.id === Modes.options.animate.id &&
					this.lastVariant &&
					!variant?.isDefault
				) {
					return this.lastVariant.textureMap.getMappedTexture(this.texture)
				}
			}
			this.lastVariant = undefined
			return context.originalGetTexture.call(this)
		}
		return context
	},
	context => {
		CubeFace.prototype.getTexture = context.originalGetTexture
	}
)
