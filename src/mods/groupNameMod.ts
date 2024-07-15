import { isCurrentFormat } from '../blueprintFormat'
import { PACKAGE } from '../constants'
import { toSafeFuntionName } from '../util/minecraftUtil'
import { createBlockbenchMod } from '../util/moddingTools'

createBlockbenchMod(
	`${PACKAGE.name}:groupNameMod`,
	{
		originalRename: Group.prototype.saveName,
	},
	context => {
		Group.prototype.saveName = function (this: Group, save?: boolean) {
			if (isCurrentFormat()) {
				this.name = toSafeFuntionName(this.name)
			}
			return context.originalRename.call(this, save)
		}
		return context
	},
	context => {
		Group.prototype.rename = context.originalRename
	}
)
