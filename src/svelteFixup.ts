import { events } from './events'
export const svelteStyleNodes = new Set<HTMLStyleElement>()
const existingStyleNodes = new Set<HTMLStyleElement>()
let isCurrentlyCollectingStyleNodes = false

export function svelteHelperMarkPluginInitialization() {
	if (!isCurrentlyCollectingStyleNodes) {
		for (const style of document.querySelectorAll('style')) {
			existingStyleNodes.add(style as HTMLStyleElement)
		}
	}
	isCurrentlyCollectingStyleNodes = true
}

function svelteHelperCollectStyleNodes() {
	if (!isCurrentlyCollectingStyleNodes) {
		return
	}
	for (const style of document.querySelectorAll('style')) {
		if (!existingStyleNodes.has(style as HTMLStyleElement)) {
			svelteStyleNodes.add(style as HTMLStyleElement)
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

events.unload.addListener(svelteHelperRemoveCollectedStyleNodes)
