import KeyframeEasingsSvelte from '../svelteComponents/keyframeEasings.svelte'
import { registerMountSvelteComponentMod } from '../util/mountSvelteComponent'

registerMountSvelteComponentMod({
	id: 'animated-java:mounted-svelte/keyframe-easings',
	component: KeyframeEasingsSvelte,
	target: '#panel_keyframe',
})
