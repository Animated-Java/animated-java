import { events } from './events'
export const svelteStyleNodes = new Set<HTMLStyleElement>()
const existingStyleNodes = new Set<HTMLStyleElement>()
let isCurrentlyCollectingStyleNodes = false
export function SvelteHelperMarkPluginInitialization() {
	if (!isCurrentlyCollectingStyleNodes) {
		for (const style of document.querySelectorAll('style')) {
			existingStyleNodes.add(style as HTMLStyleElement)
		}
	}
	isCurrentlyCollectingStyleNodes = true
}

function SvelteHelperCollectStyleNodes() {
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
export function SvelteHelperLogCollectedNodes() {
	if (process.env.NODE_ENV === 'development') {
		console.log(svelteStyleNodes)
	}
}
export function SvelteHelperMarkPluginInitializationComplete() {
	SvelteHelperCollectStyleNodes()
	isCurrentlyCollectingStyleNodes = false
}

export function SvelteHelperRemoveCollectedStyleNodes() {
	for (const style of svelteStyleNodes) {
		style.remove()
	}
	svelteStyleNodes.clear()
}
events.unload.addListener(SvelteHelperRemoveCollectedStyleNodes)
