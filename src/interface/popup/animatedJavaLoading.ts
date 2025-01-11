import { SvelteComponentDev } from 'svelte/internal'
import AnimatedJavaLoadingPopup from '../../components/animatedJavaLoadingPopup.svelte'
import { injectSvelteCompomponent } from '../../util/injectSvelteComponent'
import { Valuable } from '../../util/stores'

const LOADED = new Valuable(false)
const OFFLINE = new Valuable(false)
const PROGRESS = new Valuable(0)
const PROGRESS_LABEL = new Valuable('')
let activeComponent: SvelteComponentDev | undefined

export async function showLoadingPopup() {
	if (activeComponent) return
	activeComponent = await injectSvelteCompomponent({
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
	if (!activeComponent) return
	LOADED.set(true)
	setTimeout(() => {
		if (!activeComponent) return
		activeComponent.$destroy()
		activeComponent = undefined
	}, 2000)
}

export function showOfflineError() {
	if (!activeComponent) return
	OFFLINE.set(true)
	// FIXME - Change this into a X button instead of a timeout.
	setTimeout(() => {
		if (!activeComponent) return
		activeComponent.$destroy()
		activeComponent = undefined
	}, 10000)
}

export function updateLoadingProgress(progress: number) {
	PROGRESS.set(progress)
}

export function updateLoadingProgressLabel(label: string) {
	PROGRESS_LABEL.set(label)
}
