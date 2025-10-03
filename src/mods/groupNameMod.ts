import { registerMod } from 'src/util/moddingTools'
import { activeProjectIsBlueprintFormat } from '../blueprintFormat'
import { sanitizeOutlinerElementName } from '../outliner/util'

registerMod({
	id: `animated-java:group-name-mod`,

	apply: () => {
		const originalRename = Group.prototype.saveName
		Group.prototype.saveName = function (this: Group, save?: boolean) {
			if (activeProjectIsBlueprintFormat()) {
				this.name = sanitizeOutlinerElementName(this.name, this.uuid)
			}
			return originalRename.call(this, save)
		}

		const originalSanitize = Group.prototype.sanitizeName
		Group.prototype.sanitizeName = function (this: Group) {
			if (activeProjectIsBlueprintFormat()) {
				this.name = sanitizeOutlinerElementName(this.name, this.uuid)
			}
			return originalSanitize.call(this)
		}

		return { originalRename, originalSanitize }
	},

	revert: ({ originalRename, originalSanitize }) => {
		Group.prototype.rename = originalRename
		Group.prototype.sanitizeName = originalSanitize
	},
})
