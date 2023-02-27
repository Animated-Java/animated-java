import { AJInjectedSvelteComponent } from './ajInjectedSvelte'
import KeyframeComponent from './components/keyframe.svelte'

const ajKeyframe = new AJInjectedSvelteComponent(KeyframeComponent, {}, () =>
	document.querySelector('#panel_keyframe')?.querySelector('.panel_vue_wrapper')
)
