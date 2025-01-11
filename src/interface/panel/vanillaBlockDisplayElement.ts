import VanillaBlockDisplayElementPanel from '../../components/vanillaBlockDisplayElementPanel.svelte'
import { injectSvelteCompomponentMod } from '../../util/injectSvelteComponent'

injectSvelteCompomponentMod({
	component: VanillaBlockDisplayElementPanel,
	props: {},
	elementSelector() {
		return document.querySelector('#panel_element')
	},
})
