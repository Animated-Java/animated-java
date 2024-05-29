import VanillaItemDisplayElementPanel from '../components/vanillaItemDisplayElementPanel.svelte'
import { injectSvelteCompomponentMod } from '../util/injectSvelte'

injectSvelteCompomponentMod({
	svelteComponent: VanillaItemDisplayElementPanel,
	svelteComponentProperties: {},
	elementSelector() {
		return document.querySelector('#panel_element')
	},
})
