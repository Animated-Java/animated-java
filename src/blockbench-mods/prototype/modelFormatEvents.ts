import { BLUEPRINT_FORMAT } from '../../blockbench-additions/model-formats/ajblueprint'
import { PACKAGE } from '../../constants'
import EVENTS from '../../util/events'
import { createBlockbenchMod } from '../../util/moddingTools'

createBlockbenchMod(
	`${PACKAGE.name}:mods/prototype/modelFormatEvents`,
	{
		originalSelect: ModelProject.prototype.select,
	},
	context => {
		ModelProject.prototype.select = function (this: ModelProject) {
			if (this.format.id === BLUEPRINT_FORMAT.id) {
				EVENTS.PRE_SELECT_PROJECT.dispatch(this)
			}
			return context.originalSelect.call(this)
		}
		return context
	},
	context => {
		ModelProject.prototype.select = context.originalSelect
	}
)
