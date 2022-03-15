export const PLUGIN = {
	LOAD: 'plugin:load',
	UNLOAD: 'plugin:unload',
	INSTALL: 'plugin:install',
	UNINSTALL: 'plugin:uninstall',
}
export const LIFECYCLE = {
	LOAD: 'lifecycle:load',
	UNLOAD: 'lifecycle:unload',
	INSTALL: 'lifecycle:install',
	UNINSTALL: 'lifecycle:uninstall',
	LOAD_MODEL: 'lifecycle:load_model',
	CLEANUP: 'lifecycle:cleanup',
}
export const INTERNAL = {
	VARIANTS_MODE_SELECTED: 'internal:variants_mode_selected',
	VARIANTS_MODE_DESELECTED: 'internal:variants_mode_deselected',
}
export default {
	PLUGIN,
	LIFECYCLE,
	INTERNAL,
}
