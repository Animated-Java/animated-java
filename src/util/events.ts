import { consoleGroupCollapsed } from './console'
import { Subscribable } from './subscribable'
import * as PACKAGE from '../../package.json'

export class PluginEvent<T = void> extends Subscribable<T> {
	protected static events: Record<string, PluginEvent<any>> = {}

	constructor(public name: string) {
		super()
		PluginEvent.events[name] = this
	}
}

export const load = new PluginEvent('load')
export const unload = new PluginEvent('unload')
export const install = new PluginEvent('install')
export const uninstall = new PluginEvent('uninstall')

export const injectMods = new PluginEvent('loadMods')
export const extractMods = new PluginEvent('unloadMods')

export const loadProject = new PluginEvent('loadProject')
export const preSelectProject = new PluginEvent<ModelProject>('preSelectProject')
export const selectProject = new PluginEvent<ModelProject>('selectProject')
export const postSelectProject = new PluginEvent<ModelProject>('postSelectProject')

export const variantPropertiesUpdate = new PluginEvent('variantPropertiesUpdate')

type Link = { link: string; section?: string }
export const onDocsLinkClicked = new PluginEvent<Link>('onDocsLinkClicked')

const injectHandler = consoleGroupCollapsed(
	`Injecting BlockbenchMods added by ${PACKAGE.name}`,
	() => injectMods.dispatch()
)
const extractHandler = consoleGroupCollapsed(
	`Extracting BlockbenchMods added by ${PACKAGE.name}`,
	() => extractMods.dispatch()
)
load.subscribe(injectHandler)
unload.subscribe(extractHandler)
install.subscribe(injectHandler)
uninstall.subscribe(extractHandler)

Blockbench.on<EventName>('load_project', () => loadProject.dispatch())
Blockbench.on<EventName>('select_project', p => {
	selectProject.dispatch(p.project)
	queueMicrotask(() => postSelectProject.dispatch(p.project))
})
