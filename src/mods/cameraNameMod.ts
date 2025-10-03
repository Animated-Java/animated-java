import { registerPluginMod } from 'src/util/moddingTools'
import { activeProjectIsBlueprintFormat } from '../blueprintFormat'
import { sanitizeOutlinerElementName } from '../outliner/util'

registerPluginMod({
	id: `animated-java:camera-name-mod`,

	condition: plugin => plugin.id === 'cameras',

	apply: () => {
		const originalRename = OutlinerElement.types.camera?.prototype.saveName
		const originalSanitize = OutlinerElement.types.camera?.prototype.sanitizeName

		if (OutlinerElement.types.camera) {
			OutlinerElement.types.camera.prototype.saveName = function (
				this: OutlinerElement,
				save?: boolean
			) {
				if (activeProjectIsBlueprintFormat()) {
					this.name = sanitizeOutlinerElementName(this.name, this.uuid)
				}
				return originalRename.call(this, save)
			}

			OutlinerElement.types.camera.prototype.sanitizeName = function (this: OutlinerElement) {
				if (activeProjectIsBlueprintFormat()) {
					this.name = sanitizeOutlinerElementName(this.name, this.uuid)
				}
				return originalSanitize.call(this)
			}
		}

		return { originalRename, originalSanitize }
	},

	revert: ({ originalRename, originalSanitize }) => {
		if (OutlinerElement.types.camera) {
			OutlinerElement.types.camera.prototype.rename = originalRename
			OutlinerElement.types.camera.prototype.sanitizeName = originalSanitize
		}
	},
})
