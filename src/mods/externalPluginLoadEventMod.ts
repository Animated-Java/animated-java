import EVENTS from 'src/util/events'
import { registerMod } from 'src/util/moddingTools'

registerMod({
	id: 'animated-java:external-plugin-load-event-mod',

	apply: () => {
		// @ts-expect-error
		const original = BBPlugin.prototype.unload
		// @ts-expect-error
		BBPlugin.prototype.unload = function () {
			const result = original.call(this)
			console.log(`Detected external plugin unload: ${this.id}`)
			EVENTS.EXTERNAL_PLUGIN_UNLOAD.publish(this)
			return result
		}

		return { original }
	},

	revert: ({ original }) => {
		// @ts-expect-error
		BBPlugin.prototype.unload = original
	},
})
