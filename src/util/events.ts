import { Subscribable } from './subscribable'
import * as PACKAGE from '../../package.json'

export class PluginEvent<EventData = void> extends Subscribable<EventData> {
	protected static events: Record<string, PluginEvent<any>> = {}
	constructor(public name: string) {
		super()
		PluginEvent.events[name] = this
	}
}

// Plugin Events
export const events = {
	LOAD: new PluginEvent('load'),
	UNLOAD: new PluginEvent('unload'),
	INSTALL: new PluginEvent('install'),
	UNINSTALL: new PluginEvent('uninstall'),

	INJECT_MODS: new PluginEvent('injectMods'),
	EXTRACT_MODS: new PluginEvent('extractMods'),
}

function injectionHandler() {
	console.log(`Injecting BlockbenchMods added by '${PACKAGE.name}'`)
	events.INJECT_MODS.dispatch()
}

function extractionHandler() {
	console.log(`Extracting BlockbenchMods added by '${PACKAGE.name}'`)
	events.EXTRACT_MODS.dispatch()
}

events.LOAD.subscribe(injectionHandler)
events.UNLOAD.subscribe(extractionHandler)
events.INSTALL.subscribe(injectionHandler)
events.UNINSTALL.subscribe(extractionHandler)
