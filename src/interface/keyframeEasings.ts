import { registerPatch } from 'blockbench-patch-manager'
import { injectComponent } from 'svelte-patching-tools'
import { activeProjectIsBlueprintFormat } from '../formats/blueprint'
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
let currentUpdatePromise: Promise<void> | null = null

const updatePanel = () => {
	if (currentUpdatePromise) {
		return currentUpdatePromise.then(() => {
			void updatePanel()
		})
	}

	currentUpdatePromise = new Promise(async resolve => {
		await unmountCallback?.()
		if (!activeProjectIsBlueprintFormat()) return

		const selectedKeyframe = Timeline.selected.at(0)
		if (selectedKeyframe && !isFirstKeyframe(selectedKeyframe)) {
			unmountCallback = injectComponent({
				component: KeyframeEasingsSvelte,
				props: { selectedKeyframe },
				elementSelector() {
					return Panels.keyframe.node
				},
				postMount() {
					currentUpdatePromise = null
					resolve()
				},
			})
		} else {
			currentUpdatePromise = null
			resolve()
		}
	})
}

registerPatch({
	id: 'animated_java:mounted-svelte/keyframe-easings',
	apply() {
		const unsub = EVENTS.UPDATE_KEYFRAME_SELECTION.subscribe(() => void updatePanel())

		return { unsub }
	},

	async revert({ unsub }) {
		unsub()
		await unmountCallback?.()
	},
})
