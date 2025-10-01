import VanillaBlockDisplayElementPanel from '../../components/vanillaBlockDisplayElementPanel.svelte'
import { injectSvelteComponentMod } from '../../util/injectSvelteComponent'

injectSvelteComponentMod({
	component: VanillaBlockDisplayElementPanel,
	props: {},
	elementSelector() {
		return document.querySelector('#panel_element')
	},
})
