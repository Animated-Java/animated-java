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

	PRE_SELECT_PROJECT: new PluginEvent<ModelProject>('preSelectProject'),
	SELECT_PROJECT: new PluginEvent<ModelProject>('selectProject'),
	UNSELECT_PROJECT: new PluginEvent<ModelProject>('deselectProject'),

	CREATE_VARIANT: new PluginEvent<Variant>('createVariant'),
	UPDATE_VARIANT: new PluginEvent<Variant>('updateVariant'),
	DELETE_VARIANT: new PluginEvent<Variant>('deleteVariant'),
	SELECT_VARIANT: new PluginEvent<Variant>('selectVariant'),

	SELECT_KEYFRAME: new PluginEvent<_Keyframe>('selectKeyframe'),
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
	events.UNSELECT_PROJECT.dispatch(project)
})
