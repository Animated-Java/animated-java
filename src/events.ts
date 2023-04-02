import { consoleGroupCollapsed } from './util/console'
import { Subscribable } from './util/subscribable'
import * as PACKAGE from '../package.json'

export class PluginEvent<T = void> extends Subscribable<T> {
	protected static events: Record<string, PluginEvent<any>> = {}

	constructor(public name: string) {
		super()
		PluginEvent.events[name] = this
	}
}

export const LOAD = new PluginEvent('load')
export const UNLOAD = new PluginEvent('unload')
export const INSTALL = new PluginEvent('install')
export const UNINSTALL = new PluginEvent('uninstall')

export const INJECT_MODS = new PluginEvent('loadMods')
export const EXTRACT_MODS = new PluginEvent('unloadMods')

export const LOAD_PROJECT = new PluginEvent('loadProject')
export const CONVERT_PROJECT = new PluginEvent('convertProject')
export const SAVE_PROJECT = new PluginEvent('saveProject')
export const PRE_SELECT_PROJECT = new PluginEvent<ModelProject>('preSelectProject')
export const SELECT_PROJECT = new PluginEvent<ModelProject>('selectProject')
export const POST_SELECT_PROJECT = new PluginEvent<ModelProject>('postSelectProject')

export const UNSELECT_PROJECT = new PluginEvent('unselectProject')

export const UPDATE_SELECTION = new PluginEvent('updateSelection')

export const VARIANT_PROPERTIES_UPDATE = new PluginEvent('variantPropertiesUpdate')

type Link = { link: string; section?: string }
export const DOCS_LINK_CLICKED = new PluginEvent<Link>('onDocsLinkClicked')

const INJECT_HANDLER = consoleGroupCollapsed(
	`Injecting BlockbenchMods added by ${PACKAGE.name}`,
	() => INJECT_MODS.dispatch()
)
const EXTRACT_HANDLER = consoleGroupCollapsed(
	`Extracting BlockbenchMods added by ${PACKAGE.name}`,
	() => EXTRACT_MODS.dispatch()
)
LOAD.subscribe(INJECT_HANDLER)
UNLOAD.subscribe(EXTRACT_HANDLER)
INSTALL.subscribe(INJECT_HANDLER)
UNINSTALL.subscribe(EXTRACT_HANDLER)

Blockbench.on<EventName>('load_project', () => LOAD_PROJECT.dispatch())
Blockbench.on<EventName>('save_project', () => SAVE_PROJECT.dispatch())
Blockbench.on<EventName>('select_project', ({ project }: { project: ModelProject }) => {
	SELECT_PROJECT.dispatch(project)
	queueMicrotask(() => POST_SELECT_PROJECT.dispatch(project))
})
Blockbench.on<EventName>('update_selection', () => UPDATE_SELECTION.dispatch())
Blockbench.on<EventName>('unselect_project', () => UNSELECT_PROJECT.dispatch())
