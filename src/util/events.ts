import { subscribable } from './subscribable'

// Plugin Events
const EVENTS = {
	LOAD: subscribable<void>(),
	UNLOAD: subscribable<void>(),
	INSTALL: subscribable<void>(),
	UNINSTALL: subscribable<void>(),

	INSTALL_PATCHES: subscribable<void>(),
	UNINSTALL_PATCHES: subscribable<void>(),

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

EVENTS.LOAD.subscribe(() => {
	EVENTS.INSTALL_PATCHES.publish()
})

EVENTS.UNLOAD.subscribe(() => {
	EVENTS.UNINSTALL_PATCHES.publish()
})

// Blockbench.on<EventName>('select_project', ({ project }: { project: ModelProject }) => {
// 	EVENTS.SELECT_PROJECT.dispatch(project)
// })
// Blockbench.on<EventName>('unselect_project', ({ project }: { project: ModelProject }) => {
// 	EVENTS.UNSELECT_PROJECT.dispatch(project)
// })

Blockbench.on('update_selection', () => EVENTS.UPDATE_SELECTION.publish())
Blockbench.on('undo', entry => EVENTS.UNDO.publish(entry))
Blockbench.on('redo', entry => EVENTS.REDO.publish(entry))
