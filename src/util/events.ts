import { name as pluginID } from '../../package.json'
import { Variant } from '../variants'
import { Subscribable } from './subscribable'

export class PluginEvent<EventData = void> extends Subscribable<EventData> {
	protected static events: Record<string, PluginEvent<any>> = {}
	constructor(public name: string) {
		super()
		PluginEvent.events[name] = this
	}
}

// Plugin Events
const EVENTS = {
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

	UNDO: new PluginEvent<UndoEntry>('undo'),
	REDO: new PluginEvent<UndoEntry>('redo'),
}

export default EVENTS

function injectionHandler() {
	console.groupCollapsed(`Injecting BlockbenchMods added by '${pluginID}'`)
	EVENTS.INJECT_MODS.dispatch()
	console.groupEnd()
}

function extractionHandler() {
	console.groupCollapsed(`Extracting BlockbenchMods added by '${pluginID}'`)
	EVENTS.EXTRACT_MODS.dispatch()
	console.groupEnd()
}

EVENTS.LOAD.subscribe(injectionHandler)
EVENTS.UNLOAD.subscribe(extractionHandler)
EVENTS.INSTALL.subscribe(injectionHandler)
EVENTS.UNINSTALL.subscribe(extractionHandler)

Blockbench.on<EventName>('select_project', ({ project }: { project: ModelProject }) => {
	EVENTS.SELECT_PROJECT.dispatch(project)
})
Blockbench.on<EventName>('unselect_project', ({ project }: { project: ModelProject }) => {
	EVENTS.UNSELECT_PROJECT.dispatch(project)
})
Blockbench.on<EventName>('update_selection', () => EVENTS.UPDATE_SELECTION.dispatch())
Blockbench.on<EventName>('undo', (entry: UndoEntry) => EVENTS.UNDO.dispatch(entry))
Blockbench.on<EventName>('redo', (entry: UndoEntry) => EVENTS.REDO.dispatch(entry))
