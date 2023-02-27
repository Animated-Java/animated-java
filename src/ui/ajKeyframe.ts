import { AJInjectedSvelteComponent } from './ajInjectedSvelte'
import KeyframeComponent from './components/keyframe.svelte'

const ajKeyframe = new AJInjectedSvelteComponent(
	KeyframeComponent,
	{},
	{
		elementSelector() {
			return document.querySelector('#panel_keyframe .panel_vue_wrapper')
		},
	}
)
