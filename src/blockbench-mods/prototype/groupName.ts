import { isCurrentFormat } from '../../blockbench-additions/model-formats/ajblueprint'
import { sanitizeOutlinerElementName } from '../../blockbench-additions/outliner-elements/util'
import { PACKAGE } from '../../constants'
import { createBlockbenchMod } from '../../util/moddingTools'

/**
 * Changes the sanitization of group names to use the same method as all other outliner elements in a Blueprint
 */
createBlockbenchMod(
	`${PACKAGE.name}:mods/prototype/groupName`,
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
