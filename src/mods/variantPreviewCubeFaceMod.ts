import { activeProjectIsBlueprintFormat } from '../formats/blueprint'
import { registerMod } from '../util/moddingTools'
import { Variant } from '../variants'

declare global {
	interface CubeFace {
		lastVariant: Variant | undefined
	}
}

registerMod({
	id: `animated-java:variant-preview-cube-face`,

	apply: () => {
		const original = CubeFace.prototype.getTexture

		CubeFace.prototype.getTexture = function (this: CubeFace): Texture | undefined {
			if (activeProjectIsBlueprintFormat() && this.texture) {
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
			return original.call(this)
		}

		return { original }
	},

	revert: ({ original }) => {
		CubeFace.prototype.getTexture = original
	},
})
