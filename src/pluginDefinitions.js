import { format } from './modelFormat'
import { bus } from './util/bus'

Plugin.register('animated_java', {
	name: 'ajmodel',
	title: 'Animated Java',
	author: 'FetchBot & SnaveSutit',
	description: process.env.PLUGIN_DESCRIPTION,
	about: process.env.PLUGIN_ABOUT,
	icon: 'icon-armor_stand',
	version: process.env.PLUGIN_VERSION,
	min_version: '4.1.0',
	variant: 'desktop',
	tags: ['Minecraft: Java Edition', 'Animation', 'Armor Stand'],
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
