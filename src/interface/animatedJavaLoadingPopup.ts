import { SvelteComponent } from 'svelte'
import AnimatedJavaLoadingPopup from '../components/animatedJavaLoadingPopup.svelte'
import { injectSvelteCompomponent } from '../util/injectSvelte'
import { Valuable } from '../util/stores'

const LOADED = new Valuable(false)
let activeComponent: SvelteComponent | undefined

export async function showLoadingPopup() {
	if (activeComponent) return
	activeComponent = await injectSvelteCompomponent({
		svelteComponent: AnimatedJavaLoadingPopup,
		svelteComponentProperties: {
			loaded: LOADED,
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
