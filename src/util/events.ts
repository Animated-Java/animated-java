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

	NETWORK_CONNECTED: new PluginEvent('networkConnected'),

	MINECRAFT_ASSETS_LOADED: new PluginEvent('minecraftAssetsLoaded'),
	MINECRAFT_REGISTRY_LOADED: new PluginEvent('minecraftRegistriesLoaded'),
	MINECRAFT_FONTS_LOADED: new PluginEvent('minecraftFontsLoaded'),
	BLOCKSTATE_REGISTRY_LOADED: new PluginEvent('blockstateRegistryLoaded'),

	PRE_SELECT_PROJECT: new PluginEvent<ModelProject>('preSelectProject'),
	SELECT_PROJECT: new PluginEvent<ModelProject>('selectProject'),
	UNSELECT_PROJECT: new PluginEvent<ModelProject>('deselectProject'),

	SELECT_AJ_PROJECT: new PluginEvent<ModelProject>('selectAJProject'),
	UNSELECT_AJ_PROJECT: new PluginEvent<ModelProject>('unselectAJProject'),

	CREATE_VARIANT: new PluginEvent<Variant>('createVariant'),
	UPDATE_VARIANT: new PluginEvent<Variant>('updateVariant'),
	DELETE_VARIANT: new PluginEvent<Variant>('deleteVariant'),
	SELECT_VARIANT: new PluginEvent<Variant>('selectVariant'),

	SELECT_KEYFRAME: new PluginEvent<_Keyframe>('selectKeyframe'),
	UNSELECT_KEYFRAME: new PluginEvent('unselectKeyframe'),

	UPDATE_SELECTION: new PluginEvent('updateSelection'),
}

function injectionHandler() {
	console.groupCollapsed(`Injecting BlockbenchMods added by '${PACKAGE.name}'`)
	events.INJECT_MODS.dispatch()
	console.groupEnd()
}

function extractionHandler() {
	console.groupCollapsed(`Extracting BlockbenchMods added by '${PACKAGE.name}'`)
	events.EXTRACT_MODS.dispatch()
	console.groupEnd()
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
Blockbench.on<EventName>('update_selection', () => events.UPDATE_SELECTION.dispatch())
