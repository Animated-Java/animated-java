import EVENTS from 'src/util/events'
import { registerPropertyOverrideMod } from 'src/util/moddingTools'

registerPropertyOverrideMod({
	id: `animated-java:event-hook/external-plugin-unload`,
	object: BBPlugin.prototype,
	key: 'unload',

	override: original => {
		return async function (this: BBPlugin) {
			const result = original.call(this)
			console.log(`Detected external plugin unload: ${this.id}`)
			EVENTS.EXTERNAL_PLUGIN_UNLOAD.publish(this)
			return result
		}
	},
})
