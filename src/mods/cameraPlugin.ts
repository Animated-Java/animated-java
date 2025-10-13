import { registerPluginMod } from 'src/util/moddingTools'
import { activeProjectIsBlueprintFormat } from '../formats/blueprint'
import { sanitizeOutlinerElementName } from '../outliner/util'

registerPluginMod({
	id: `animated-java:camera-plugin/camera-name-sanitization`,

	condition: plugin => plugin.id === 'cameras',

	apply: () => {
		const camera = OutlinerElement.types.camera

		const originalRename = camera.prototype.saveName
		camera.prototype.saveName = function (this: OutlinerElement, save?: boolean) {
			if (activeProjectIsBlueprintFormat()) {
				this.name = sanitizeOutlinerElementName(this.name, this.uuid)
			}
			return originalRename.call(this, save)
		}

		const originalSanitize = camera.prototype.sanitizeName
		camera.prototype.sanitizeName = function (this: OutlinerElement) {
			if (activeProjectIsBlueprintFormat()) {
				this.name = sanitizeOutlinerElementName(this.name, this.uuid)
			}
			return originalSanitize.call(this)
		}

		return { camera, originalRename, originalSanitize }
	},

	revert: ({ camera, originalRename, originalSanitize }) => {
		camera.prototype.rename = originalRename
		camera.prototype.sanitizeName = originalSanitize
	},
})
