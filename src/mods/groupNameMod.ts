import { isCurrentFormat } from '../blueprintFormat'
import { PACKAGE } from '../constants'
import { sanitizeOutlinerElementName } from '../outliner/util'
import { createBlockbenchMod } from '../util/moddingTools'

createBlockbenchMod(
	`${PACKAGE.name}:groupNameMod`,
	{
		originalRename: Group.prototype.saveName,
		originalSanitize: Group.prototype.sanitizeName,
	},
	context => {
		Group.prototype.saveName = function (this: Group, save?: boolean) {
			if (isCurrentFormat()) {
				this.name = sanitizeOutlinerElementName(this.name, this.uuid)
			}
			return context.originalRename.call(this, save)
		}
		Group.prototype.sanitizeName = function (this: Group) {
			if (isCurrentFormat()) {
				this.name = sanitizeOutlinerElementName(this.name, this.uuid)
			}
			return context.originalSanitize.call(this)
		}
		return context
	},
	context => {
		Group.prototype.rename = context.originalRename
	}
)
