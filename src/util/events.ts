import { Subscribable } from './suscribable'

interface IEvents {
	load: AnimatedJavaEvent
	unload: AnimatedJavaEvent
	install: AnimatedJavaEvent
	uninstall: AnimatedJavaEvent
	loadMods: AnimatedJavaEvent
	unloadMods: AnimatedJavaEvent

	loadProject: AnimatedJavaEvent
	selectProject: AnimatedJavaEvent<ModelProject>
	postSelectProject: AnimatedJavaEvent<ModelProject>

	onDocsLinkClicked: AnimatedJavaEvent<{ link: string; section?: string }>
	// Should show an error if an event that hasn't been labled in IEvents is registered or referenced.
	// [name: string]: AnimatedJavaEvent
}
class AnimatedJavaEvent<T = void> extends Subscribable<T> {
	static events: any = {}

	name: keyof IEvents
	listeners: ((data: T) => void)[] = []
	constructor(name: keyof IEvents) {
		super()
		this.name = name
		this.listeners = []
		AnimatedJavaEvent.events[name] = this
	}
}
export const events = AnimatedJavaEvent.events as IEvents

const load = new AnimatedJavaEvent('load')
const unload = new AnimatedJavaEvent('unload')
const install = new AnimatedJavaEvent('install')
const uninstall = new AnimatedJavaEvent('uninstall')

const loadMods = new AnimatedJavaEvent('loadMods')
const unloadMods = new AnimatedJavaEvent('unloadMods')

const loadProject = new AnimatedJavaEvent('loadProject')
const selectProject = new AnimatedJavaEvent<ModelProject>('selectProject')
const postSelectProject = new AnimatedJavaEvent<ModelProject>('postSelectProject')

const onDocsLinkClicked = new AnimatedJavaEvent<{ link: string; section?: string }>(
	'onDocsLinkClicked'
)

load.subscribe(() => loadMods.dispatch())
unload.subscribe(() => unloadMods.dispatch())
install.subscribe(() => loadMods.dispatch())
uninstall.subscribe(() => unloadMods.dispatch())

Blockbench.on<EventName>('load_project', () => loadProject.dispatch())
Blockbench.on<EventName>('select_project', p => {
	selectProject.dispatch(p.project)
	queueMicrotask(() => postSelectProject.dispatch(p.project))
})
