import { name as pluginID } from '../../package.json'
import { subscribable } from './subscribable'

// Plugin Events
const EVENTS = {
	LOAD: subscribable<void>(),
	UNLOAD: subscribable<void>(),
	INSTALL: subscribable<void>(),
	UNINSTALL: subscribable<void>(),

	INSTALL_MODS: subscribable<void>(),
	UNINSTALL_MODS: subscribable<void>(),

	NETWORK_CONNECTED: subscribable<void>(),

	MINECRAFT_ASSETS_LOADED: subscribable<void>(),
	MINECRAFT_REGISTRY_LOADED: subscribable<void>(),
	MINECRAFT_FONTS_LOADED: subscribable<void>(),
	BLOCKSTATE_REGISTRY_LOADED: subscribable<void>(),

	// PRE_SELECT_PROJECT: subscribable<ModelProject>(),
	// SELECT_PROJECT: subscribable<ModelProject>(),
	// UNSELECT_PROJECT: subscribable<ModelProject>(),

	// SELECT_AJ_PROJECT: subscribable<ModelProject>(),
	// UNSELECT_AJ_PROJECT: subscribable<ModelProject>(),

	// CREATE_VARIANT: subscribable<Variant>(),
	// UPDATE_VARIANT: subscribable<Variant>(),
	// DELETE_VARIANT: subscribable<Variant>(),
	// SELECT_VARIANT: subscribable<Variant>(),

	SELECT_KEYFRAME: subscribable<_Keyframe>(),
	UNSELECT_KEYFRAME: subscribable<void>(),

	UPDATE_SELECTION: subscribable<void>(),

	UNDO: subscribable<UndoEntry>(),
	REDO: subscribable<UndoEntry>(),
}

export default EVENTS

function installHandler() {
	console.groupCollapsed(`Installing BlockbenchMods added by '${pluginID}'`)
	EVENTS.INSTALL_MODS.publish()
	console.groupEnd()
}

function uninstallHandler() {
	console.groupCollapsed(`Uninstalling BlockbenchMods added by '${pluginID}'`)
	EVENTS.UNINSTALL_MODS.publish()
	console.groupEnd()
}

EVENTS.LOAD.subscribe(installHandler)
EVENTS.UNLOAD.subscribe(uninstallHandler)
EVENTS.INSTALL.subscribe(installHandler)
EVENTS.UNINSTALL.subscribe(uninstallHandler)

// Blockbench.on<EventName>('select_project', ({ project }: { project: ModelProject }) => {
// 	EVENTS.SELECT_PROJECT.dispatch(project)
// })
// Blockbench.on<EventName>('unselect_project', ({ project }: { project: ModelProject }) => {
// 	EVENTS.UNSELECT_PROJECT.dispatch(project)
// })

Blockbench.on('update_selection', () => EVENTS.UPDATE_SELECTION.publish())
Blockbench.on('undo', entry => EVENTS.UNDO.publish(entry))
Blockbench.on('redo', entry => EVENTS.REDO.publish(entry))
