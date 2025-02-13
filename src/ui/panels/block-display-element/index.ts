import { injectSvelteCompomponentMod } from '../../../util/injectSvelteComponent'
import BlockDisplayElementPanel from './vanillaBlockDisplayElementPanel.svelte'

injectSvelteCompomponentMod({
	component: BlockDisplayElementPanel,
	props: {},
	elementSelector() {
		return document.querySelector('#panel_element')
	},
})
