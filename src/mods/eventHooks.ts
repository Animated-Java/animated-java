import { registerPropertyOverridePatch } from 'blockbench-patch-manager'
import EVENTS from '../util/events'

registerPropertyOverridePatch({
	id: `animated_java:event-hook/external-plugin-load/load`,
	target: BBPlugin.prototype,
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

registerPropertyOverridePatch({
	id: `animated_java:event-hook/external-plugin-load/toggle-disabled`,
	target: BBPlugin.prototype,
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

registerPropertyOverridePatch({
	id: `animated_java:event-hook/external-plugin-unload/unload`,
	target: BBPlugin.prototype,
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

registerPropertyOverridePatch({
	id: `animated_java:event-hook/pre-post-select-project-event`,
	target: ModelProject.prototype,
	key: 'loadEditorState',

	get: original => {
		return function (this: ModelProject) {
			EVENTS.PRE_SELECT_PROJECT.publish(this)
			const result = original.call(this)
			EVENTS.POST_SELECT_PROJECT.publish(this)
			return result
		}
	},
})
