import VanillaBlockDisplayElementPanel from '../components/vanillaBlockDisplayElementPanel.svelte'
import { injectSvelteCompomponentMod } from '../util/injectSvelte'

injectSvelteCompomponentMod({
	svelteComponent: VanillaBlockDisplayElementPanel,
	svelteComponentProperties: {},
	elementSelector() {
		return document.querySelector('#panel_element')
	},
})
