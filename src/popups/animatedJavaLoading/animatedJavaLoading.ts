// TODO - Add a full-screen loading animation while AJ is initializing.
// TODO - Add an animation of an armor_stand using a hammer on an anvil to the loading screen.
import { observable } from 'svelte-observable-store'
import { injectComponent } from 'svelte-patching-tools'
import AnimatedJavaLoadingPopup from './animatedJavaLoading.svelte'

const LOADED = observable(false)
const OFFLINE = observable(false)
const PROGRESS = observable(0)
const PROGRESS_LABEL = observable('')

let unmountCallback: (() => Promise<void>) | null

export function showLoadingPopup() {
	if (unmountCallback) return
	unmountCallback = injectComponent({
		component: AnimatedJavaLoadingPopup,
		props: {
			loaded: LOADED,
			offline: OFFLINE,
			progress: PROGRESS,
			progressLabel: PROGRESS_LABEL,
		},
		elementSelector() {
			return document.body
		},
	})
}

export function hideLoadingPopup() {
	if (!unmountCallback) return
	LOADED.set(true)
	setTimeout(async () => {
		if (!unmountCallback) return
		await unmountCallback()
		unmountCallback = null
	}, 2000)
}

export function showOfflineError() {
	if (!unmountCallback) return
	OFFLINE.set(true)
	// FIXME - Change this into a X button instead of a timeout.
	setTimeout(async () => {
		if (!unmountCallback) return
		await unmountCallback()
		unmountCallback = null
	}, 10000)
}

export function updateLoadingProgress(progress: number) {
	PROGRESS.set(progress)
}

export function updateLoadingProgressLabel(label: string) {
	PROGRESS_LABEL.set(label)
}
