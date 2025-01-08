import { isCurrentFormat } from '../blueprintFormat'
import { PACKAGE } from '../constants'
import { sanitizeOutlinerElementName } from '../outliner/util'
import { createBlockbenchMod } from '../util/moddingTools'

createBlockbenchMod(
	`${PACKAGE.name}:cameraNameMod`,
	{
		originalRename: OutlinerElement.types.camera?.prototype.saveName,
		originalSanitize: OutlinerElement.types.camera?.prototype.sanitizeName,
	},
	context => {
		if (OutlinerElement.types.camera) {
			OutlinerElement.types.camera.prototype.saveName = function (
				this: OutlinerElement,
				save?: boolean
			) {
				if (isCurrentFormat()) {
					this.name = sanitizeOutlinerElementName(this.name, this.uuid)
				}
				return context.originalRename.call(this, save)
			}
			OutlinerElement.types.camera.prototype.sanitizeName = function (this: OutlinerElement) {
				if (isCurrentFormat()) {
					this.name = sanitizeOutlinerElementName(this.name, this.uuid)
				}
				return context.originalSanitize.call(this)
			}
		}
		return context
	},
	context => {
		if (OutlinerElement.types.camera) {
			OutlinerElement.types.camera.prototype.rename = context.originalRename
		}
	}
)
