import EVENTS from 'src/util/events'
import { registerPropertyOverrideMod } from 'src/util/moddingTools'

registerPropertyOverrideMod({
	id: `animated-java:event-hook/external-plugin-load/load`,
	object: BBPlugin.prototype,
	key: 'load',

	get: original => {
		return function (this: BBPlugin) {
			const result = original.call(this)
			console.log('Loaded plugin:', this.id)
			EVENTS.EXTERNAL_PLUGIN_LOAD.publish(this)
			return result
		}
	},
})

registerPropertyOverrideMod({
	id: `animated-java:event-hook/external-plugin-load/toggle-disabled`,
	object: BBPlugin.prototype,
	key: 'toggleDisabled',

	get: original => {
		return function (this: BBPlugin) {
			const result = original.call(this)
			if (this.disabled) return result
			console.log('Enabled plugin:', this.id)
			EVENTS.EXTERNAL_PLUGIN_LOAD.publish(this)
			return result
		}
	},
})

registerPropertyOverrideMod({
	id: `animated-java:event-hook/external-plugin-unload/unload`,
	object: BBPlugin.prototype,
	key: 'unload',

	get: original => {
		return function (this: BBPlugin) {
			const result = original.call(this)
			console.log('Unloaded plugin:', this.id)
			EVENTS.EXTERNAL_PLUGIN_UNLOAD.publish(this)
			return result
		}
	},
})

registerPropertyOverrideMod({
	id: `animated-java:event-hook/pre-select-project-event`,
	object: ModelProject.prototype,
	key: 'select',

	get: original => {
		return function (this: ModelProject) {
			EVENTS.PRE_SELECT_PROJECT.publish(this)
			return original.call(this)
		}
	},
})
