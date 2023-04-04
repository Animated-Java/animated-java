import { injectSvelteCompomponent } from './util/injectedSvelte'
import StartScreenComponent from './components/startScreen.svelte'

export function injectStartScreen() {
	injectSvelteCompomponent({
		svelteComponent: StartScreenComponent,
		svelteComponentArgs: {},
		elementSelector() {
			return document.querySelector('div.animated-java-start-screen')
		},
	})
}
