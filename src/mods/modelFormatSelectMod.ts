import EVENTS from '../util/events'
import { registerMod } from '../util/moddingTools'

registerMod({
	id: `animated-java:model-format-pre-select-project-event`,

	apply: () => {
		const original = ModelProject.prototype.select

		ModelProject.prototype.select = function (this: ModelProject) {
			EVENTS.PRE_SELECT_PROJECT.publish(this)
			return original.call(this)
		}

		return { original }
	},

	revert: ({ original }) => {
		ModelProject.prototype.select = original
	},
})
