import { registerPatch } from 'blockbench-patch-manager'
import { getPreviewSlotTexture } from '../animationPreview'
import { activeProjectIsBlueprintFormat } from '../formats/blueprint'
import { getTextureSlot, shouldResolveSlots } from '../textureSlots'

registerPatch({
	id: `animated_java:variant-preview-cube-face`,

	apply: () => {
		const original = CubeFace.prototype.getTexture

		// A face using a Texture Slot shows (and paints) the texture the slot currently shows.
		CubeFace.prototype.getTexture = function (this: CubeFace) {
			if (
				activeProjectIsBlueprintFormat() &&
				typeof this.texture === 'string' &&
				shouldResolveSlots()
			) {
				const slot = getTextureSlot(this.texture)
				if (slot) {
					const bone = this.cube.parent instanceof Group ? this.cube.parent : undefined
					const texture = getPreviewSlotTexture(slot, bone)
					if (texture) return texture
				}
			}
			return original.call(this)
		}

		return { original }
	},

	revert: ({ original }) => {
		CubeFace.prototype.getTexture = original
	},
})
