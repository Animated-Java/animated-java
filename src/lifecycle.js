import { bus } from './util/bus'
import EVENTS from './constants/events'
const log = (...args) => console.log('[java-animations@redirect]', ...args)
const redirect = (from, to) => {
	log(`redirect: ${from} -> ${to}`)
	bus.on(from, e => {
		bus.dispatch(to, e)
	})
}

console.groupCollapsed('lifecycle event redirects')
redirect(EVENTS.PLUGIN.INSTALL, EVENTS.LIFECYCLE.INSTALL)
redirect(EVENTS.PLUGIN.LOAD, EVENTS.LIFECYCLE.LOAD)
redirect(EVENTS.PLUGIN.UNINSTALL, EVENTS.LIFECYCLE.UNINSTALL)
redirect(EVENTS.PLUGIN.UNLOAD, EVENTS.LIFECYCLE.UNLOAD)

redirect(EVENTS.PLUGIN.UNINSTALL, EVENTS.LIFECYCLE.CLEANUP)
redirect(EVENTS.PLUGIN.UNLOAD, EVENTS.LIFECYCLE.CLEANUP)
console.groupEnd()
