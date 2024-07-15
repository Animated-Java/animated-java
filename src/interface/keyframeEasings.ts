import KeyframeEasingsSvelte from '../components/keyframeEasings.svelte'
import { injectSvelteCompomponentMod } from '../util/injectSvelteComponent'

injectSvelteCompomponentMod({
	component: KeyframeEasingsSvelte,
	props: {},
	elementSelector() {
		return $('#panel_keyframe')[0]
	},
})
