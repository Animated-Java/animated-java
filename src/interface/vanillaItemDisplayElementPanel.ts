import VanillaItemDisplayElementPanel from '../components/vanillaItemDisplayElementPanel.svelte'
import { injectSvelteCompomponentMod } from '../util/injectSvelteComponent'

injectSvelteCompomponentMod({
	component: VanillaItemDisplayElementPanel,
	props: {},
	elementSelector() {
		return document.querySelector('#panel_element')
	},
})
