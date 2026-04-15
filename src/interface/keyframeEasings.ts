import { registerPatch } from 'blockbench-patch-manager'
import { injectComponent } from 'svelte-patching-tools'
import KeyframeEasingsSvelte from '../svelteComponents/keyframeEasings.svelte'
import EVENTS from '../util/events'

function isFirstKeyframe(kf: _Keyframe) {
	return (
		kf.animator.keyframes
			.filter(k => k.channel === kf.channel)
			.sort((a, b) => a.time - b.time)[0] === kf
	)
}

let unmountCallback: (() => Promise<void>) | null = null
let selectedKeyframe: _Keyframe | undefined

registerPatch({
	id: 'animated_java:mounted-svelte/keyframe-easings',
	apply() {
		const unsub = EVENTS.UPDATE_KEYFRAME_SELECTION.subscribe(async () => {
			selectedKeyframe = Timeline.selected.at(0)
			await unmountCallback?.()
			if (!selectedKeyframe || isFirstKeyframe(selectedKeyframe)) return

			unmountCallback = injectComponent({
				component: KeyframeEasingsSvelte,
				props: { selectedKeyframe },
				elementSelector(): HTMLElement | null {
					return document.querySelector('#panel_keyframe')
				},
			})
		})

		return { unsub }
	},

	async revert({ unsub }) {
		unsub()
		await unmountCallback?.()
	},
})
