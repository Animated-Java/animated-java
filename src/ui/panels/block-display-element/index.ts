import { injectSvelteCompomponentMod } from '../../../util/injectSvelteComponent'
import VanillaBlockDisplayElementPanel from './vanillaBlockDisplayElementPanel.svelte'

injectSvelteCompomponentMod({
	component: VanillaBlockDisplayElementPanel,
	props: {},
	elementSelector() {
		return document.querySelector('#panel_element')
	},
})
