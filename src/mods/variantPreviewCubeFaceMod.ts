import { registerPatch } from 'blockbench-patch-manager'
import { activeProjectIsBlueprintFormat } from '../formats/blueprint'
import {
	getSlotDefaultTexture,
	getSlotPreviewTexture,
	getTextureSlot,
	shouldResolveSlots,
} from '../textureSlots'
import { Variant } from '../variants'

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
					const variant = Variant.selected
					const excluded =
						this.cube.parent instanceof Group &&
						variant?.excludedNodes.has(this.cube.parent.uuid) &&
						variant.slotTextures.has(slot.uuid)
					const texture = excluded
						? getSlotDefaultTexture(slot)
						: getSlotPreviewTexture(slot)
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
