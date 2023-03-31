import { ajModelFormat } from '../modelFormat'
import { createBlockbenchMod } from '../util/moddingTools'

createBlockbenchMod(
	'animated_java:cube_face/variants',
	{
		originalGetTexture: CubeFace.prototype.getTexture,
	},
	context => {
		CubeFace.prototype.getTexture = function (this: CubeFace) {
			if (
				Format === ajModelFormat &&
				this.texture !== undefined &&
				this.texture !== null &&
				this.texture !== false
			) {
				const variant = Project!.animated_java_variants?.selectedVariant
				if (variant) {
					const uuid = variant.getMappedUuid(this.texture)
					if (uuid && this.cube.parent instanceof Group) {
						const included = variant.affectedBones.find(
							v => v.value === (this.cube.parent as Group).uuid
						)
						if (
							(included && variant.affectedBonesIsAWhitelist) ||
							(!included && !variant.affectedBonesIsAWhitelist)
						)
							if (uuid) return Texture.all.find(t => t.uuid === uuid) || null
					}
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
