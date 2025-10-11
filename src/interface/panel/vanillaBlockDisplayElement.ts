import { registerMountSvelteComponentMod } from 'src/util/mountSvelteComponent'
import VanillaBlockDisplayElementPanel from '../../components/vanillaBlockDisplayElementPanel.svelte'

registerMountSvelteComponentMod({
	id: 'animated-java:append-element-panel/vanilla-block-display',
	component: VanillaBlockDisplayElementPanel,
	target: '#panel_element',
})
