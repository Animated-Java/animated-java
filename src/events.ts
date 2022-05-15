type ListenerFunction = () => void

interface IEvents {
	load: AnimatedJavaEvent
	unload: AnimatedJavaEvent
	install: AnimatedJavaEvent
	uninstall: AnimatedJavaEvent
	loadMods: AnimatedJavaEvent
	unloadMods: AnimatedJavaEvent

	// Should show an error if an event that hasn't been labled in IEvents is registered or referenced.
	// [name: string]: AnimatedJavaEvent
}

class AnimatedJavaEvent {
	static events = {} as IEvents

	name: keyof IEvents
	listeners: ListenerFunction[] = []
	constructor(name: keyof IEvents) {
		this.name = name
		this.listeners = []
		AnimatedJavaEvent.events[name] = this
	}

	addListener(func: ListenerFunction) {
		this.listeners.push(func)
	}

	trigger() {
		this.listeners.forEach(v => v())
	}
}
export const events = AnimatedJavaEvent.events

const load = new AnimatedJavaEvent('load')
const unload = new AnimatedJavaEvent('unload')
const install = new AnimatedJavaEvent('install')
const uninstall = new AnimatedJavaEvent('uninstall')

const loadMods = new AnimatedJavaEvent('loadMods')
const unloadMods = new AnimatedJavaEvent('unloadMods')

load.addListener(() => loadMods.trigger())
unload.addListener(() => unloadMods.trigger())
install.addListener(() => loadMods.trigger())
uninstall.addListener(() => unloadMods.trigger())
