import KeyframeEasingsSvelte from '../components/keyframeEasings.svelte'
import { injectSvelteComponentMod } from '../util/injectSvelteComponent'

injectSvelteComponentMod({
	component: KeyframeEasingsSvelte,
	props: {},
	elementSelector() {
		return $('#panel_keyframe')[0]
	},
})
