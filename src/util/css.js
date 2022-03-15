import { bus } from './bus'

import EVENTS from '../constants/events'
export function css(str) {
	const deletable = Blockbench.addCSS(str)
	bus.on(EVENTS.PLUGIN.UNINSTALL, () => deletable.delete())
}
