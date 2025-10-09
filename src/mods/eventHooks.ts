import EVENTS from 'src/util/events'
import { registerPropertyOverrideMod } from 'src/util/moddingTools'

registerPropertyOverrideMod({
	id: `animated-java:event-hook/external-plugin-unload`,
	object: BBPlugin.prototype,
	key: 'unload',

	override: original => {
		return function (this: BBPlugin) {
			const result = original.call(this)
			EVENTS.EXTERNAL_PLUGIN_UNLOAD.publish(this)
			return result
		}
	},
})
