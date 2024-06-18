import { BLUEPRINT_FORMAT } from '../blueprintFormat'
import { PACKAGE } from '../constants'
import { events } from '../util/events'
import { createBlockbenchMod } from '../util/moddingTools'

createBlockbenchMod(
	`${PACKAGE.name}:modelFormatPreSelectProjectEvent`,
	{
		originalSelect: ModelProject.prototype.select,
	},
	context => {
		ModelProject.prototype.select = function (this: ModelProject) {
			if (this.format.id === BLUEPRINT_FORMAT.id) {
				events.PRE_SELECT_PROJECT.dispatch(this)
			}
			return context.originalSelect.call(this)
		}
		return context
	},
	context => {
		ModelProject.prototype.select = context.originalSelect
	}
)
