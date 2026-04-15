import { registerPatch } from 'blockbench-patch-manager'
import { injectComponent } from 'svelte-patching-tools'
import KeyframeEasingsSvelte from '../svelteComponents/keyframeEasings.svelte'

registerPatch({
	id: 'animated_java:mounted-svelte/keyframe-easings',
	apply() {
		const unmountCallback = injectComponent({
			component: KeyframeEasingsSvelte,
			elementSelector(): HTMLElement | null {
				return document.querySelector('#panel_keyframe')
			},
		})
		return { unmountCallback }
	},

	async revert({ unmountCallback }) {
		await unmountCallback?.()
	},
})
