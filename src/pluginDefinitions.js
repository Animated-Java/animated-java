import { format } from './modelFormat'
import { bus } from './util/bus'

Plugin.register('animated-java', {
	name: 'mcmodel',
	title: 'Animated Java',
	author: 'FetchBot & SnaveSutit',
	description: process.env.PLUGIN_DESCRIPTION,
	icon: 'icon-format_bedrock_legacy',
	version: process.env.PLUGIN_VERSION,
	variant: 'both',
	format,
	onload: function onload(event) {
		bus.dispatch('plugin:load', {})
	},
	onunload: function onunload(event) {
		bus.dispatch('plugin:unload', {})
	},
	oninstall: function oninstall() {
		bus.dispatch('plugin:install', {})
	},
	onuninstall: function onuninstall() {
		bus.dispatch('plugin:uninstall', {})
	},
})
