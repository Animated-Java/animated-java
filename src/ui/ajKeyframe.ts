import { injectSvelteCompomponent } from './injectSvelte'
import KeyframeComponent from './components/keyframe.svelte'

injectSvelteCompomponent({
	svelteComponent: KeyframeComponent,
	svelteComponentArgs: {},
	elementSelector() {
		return document.querySelector('#panel_keyframe .panel_vue_wrapper')
	},
})
