import * as events from './events'
export const svelteStyleNodes = new Set<HTMLStyleElement>()
const EXISTING_STYLE_NODES = new Set<HTMLStyleElement>()
let isCurrentlyCollectingStyleNodes = false

export function svelteHelperMarkPluginInitialization() {
	if (!isCurrentlyCollectingStyleNodes) {
		for (const style of document.querySelectorAll('style')) {
			EXISTING_STYLE_NODES.add(style)
		}
	}
	isCurrentlyCollectingStyleNodes = true
}

function svelteHelperCollectStyleNodes() {
	if (!isCurrentlyCollectingStyleNodes) {
		return
	}
	for (const style of document.querySelectorAll('style')) {
		if (!EXISTING_STYLE_NODES.has(style)) {
			svelteStyleNodes.add(style)
			style.setAttribute('data-aj-style', 'true')
		}
	}
}

export function svelteHelperLogCollectedNodes() {
	if (process.env.NODE_ENV === 'development') {
		console.log(svelteStyleNodes)
	}
}

export function svelteHelperMarkPluginInitializationComplete() {
	svelteHelperCollectStyleNodes()
	isCurrentlyCollectingStyleNodes = false
}

export function svelteHelperRemoveCollectedStyleNodes() {
	for (const style of svelteStyleNodes) {
		style.remove()
	}
	svelteStyleNodes.clear()
}

events.UNLOAD.subscribe(svelteHelperRemoveCollectedStyleNodes)
