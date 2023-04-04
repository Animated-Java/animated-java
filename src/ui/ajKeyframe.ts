import { injectSvelteCompomponentMod } from './util/injectedSvelte'
import KeyframeComponent from './components/keyframe.svelte'

injectSvelteCompomponentMod({
	svelteComponent: KeyframeComponent,
	svelteComponentArgs: {},
	elementSelector() {
		return document.querySelector('#panel_keyframe .panel_vue_wrapper')
	},
})
