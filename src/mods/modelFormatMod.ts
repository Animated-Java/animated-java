import { BLUEPRINT_FORMAT } from '../blueprintFormat'
import EVENTS from '../util/events'
import { registerMod } from '../util/moddingTools'

registerMod({
	id: `animated-java:model-format-pre-select-project-event`,

	apply: () => {
		const original = ModelProject.prototype.select

		ModelProject.prototype.select = function (this: ModelProject) {
			if (this.format.id === BLUEPRINT_FORMAT.id) {
				EVENTS.PRE_SELECT_PROJECT.publish(this)
			}
			return original.call(this)
		}

		return { original }
	},

	revert: ({ original }) => {
		ModelProject.prototype.select = original
	},
})
