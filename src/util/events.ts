import { subscribable } from 'simple-subpub'
import { Variant } from '../variants'

// Plugin Events
const EVENTS = {
	PLUGIN_LOAD: subscribable<void>(),
	PLUGIN_FINISHED_LOADING: subscribable<void>(),

	PLUGIN_UNLOAD: subscribable<void>(),
	PLUGIN_FINISHED_UNLOADING: subscribable<void>(),

	PLUGIN_INSTALL: subscribable<void>(),
	PLUGIN_UNINSTALL: subscribable<void>(),

	EXTERNAL_PLUGIN_LOAD: subscribable<BBPlugin>(),
	EXTERNAL_PLUGIN_UNLOAD: subscribable<BBPlugin>(),

	INJECT_MODS: subscribable<void>(),
	EXTRACT_MODS: subscribable<void>(),

	NETWORK_CONNECTED: subscribable<void>(),

	MINECRAFT_ASSETS_LOADED: subscribable<void>(),
	MINECRAFT_REGISTRY_LOADED: subscribable<void>(),
	MINECRAFT_FONTS_LOADED: subscribable<void>(),
	BLOCKSTATE_REGISTRY_LOADED: subscribable<void>(),

	SELECT_PROJECT: subscribable<ModelProject>(),
	UNSELECT_PROJECT: subscribable<ModelProject>(),
	CLOSE_PROJECT: subscribable<ModelProject>(),

	SELECT_AJ_PROJECT: subscribable<ModelProject>(),
	UNSELECT_AJ_PROJECT: subscribable<ModelProject>(),

	CREATE_VARIANT: subscribable<Variant>(),
	UPDATE_VARIANT: subscribable<Variant>(),
	DELETE_VARIANT: subscribable<Variant>(),
	SELECT_VARIANT: subscribable<Variant>(),

	UPDATE_KEYFRAME_SELECTION: subscribable<void>(),

	UPDATE_SELECTION: subscribable<void>(),

	UPDATE_VIEW: subscribable<UpdateViewOptions>(),

	UNDO: subscribable<{ entry: UndoEntry }>(),
	REDO: subscribable<{ entry: UndoEntry }>(),
}
export default EVENTS

Blockbench.on('select_project', ({ project }: { project: ModelProject }) => {
	EVENTS.SELECT_PROJECT.publish(project)
})
Blockbench.on('unselect_project', ({ project }: { project: ModelProject }) => {
	EVENTS.UNSELECT_PROJECT.publish(project)
})
Blockbench.on('close_project', () => EVENTS.CLOSE_PROJECT.publish(Project!))
Blockbench.on('update_keyframe_selection', EVENTS.UPDATE_KEYFRAME_SELECTION.publish)
Blockbench.on('update_selection', EVENTS.UPDATE_SELECTION.publish)
Blockbench.on('update_view', EVENTS.UPDATE_VIEW.publish)
Blockbench.on('undo', EVENTS.UNDO.publish)
Blockbench.on('redo', EVENTS.REDO.publish)
