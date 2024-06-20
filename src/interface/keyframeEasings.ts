import KeyframeEasingsSvelte from '../components/keyframeEasings.svelte'
import { injectSvelteCompomponentMod } from '../util/injectSvelte'

injectSvelteCompomponentMod({
	svelteComponent: KeyframeEasingsSvelte,
	svelteComponentProperties: {},
	elementSelector() {
		return $('#panel_keyframe')[0]
	},
})
