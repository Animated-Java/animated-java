import { registerMountSvelteComponentMod } from 'src/util/mountSvelteComponent'
import KeyframeEasingsSvelte from '../components/keyframeEasings.svelte'

registerMountSvelteComponentMod({
	id: 'animated-java:mounted-svelte/keyframe-easings',
	component: KeyframeEasingsSvelte,
	target: '#panel_keyframe',
})
