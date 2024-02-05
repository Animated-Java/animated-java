import { Subscribable } from './subscribable'
import * as PACKAGE from '../../package.json'
import { Variant } from '../variants'

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

	SELECT_PROJECT: new PluginEvent<ModelProject>('selectProject'),
	DESELECT_PROJECT: new PluginEvent<ModelProject>('deselectProject'),

	CREATE_VARIANT: new PluginEvent<Variant>('createVariant'),
	EDIT_VARIANT: new PluginEvent<Variant>('editVariant'),
	DELETE_VARIANT: new PluginEvent<Variant>('deleteVariant'),
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

Blockbench.on<EventName>('select_project', ({ project }: { project: ModelProject }) => {
	events.SELECT_PROJECT.dispatch(project)
})
Blockbench.on<EventName>('unselect_project', ({ project }: { project: ModelProject }) => {
	events.DESELECT_PROJECT.dispatch(project)
})
