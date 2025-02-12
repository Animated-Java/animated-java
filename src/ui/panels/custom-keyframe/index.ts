import type { SvelteComponentDev } from 'svelte/internal'
import { isCurrentFormat } from '../../../blockbench-additions/model-formats/ajblueprint'
import { CUSTOM_CHANNELS } from '../../../blockbench-mods/misc/customKeyframes'
import EVENTS from '../../../util/events'
import { injectSvelteCompomponent } from '../../../util/injectSvelteComponent'
import { translate } from '../../../util/translation'
import CustomKeyframePanelSvelteComponent from './customKeyframePanel.svelte'

let currentPanel: SvelteComponentDev | undefined = undefined

export function injectCustomKeyframePanel(selectedKeyframe: _Keyframe) {
	if (
		!isCurrentFormat() ||
		!selectedKeyframe ||
		!CUSTOM_CHANNELS.includes(selectedKeyframe.channel)
	)
		return

	const element = document.querySelector(
		'#panel_keyframe .panel_vue_wrapper .keyframe_data_point'
	)
	if (!element) {
		console.warn(
			'Failed to find keyframe panel element. Aborting custom keyframe panel injection.'
		)
		return
	}
	for (const child of [...element.children]) {
		child.remove()
	}

	void injectSvelteCompomponent({
		component: CustomKeyframePanelSvelteComponent,
		props: {
			selectedKeyframe,
		},
		elementSelector() {
			return element
		},
		postMount(comp) {
			const label = jQuery('#panel_keyframe .panel_vue_wrapper #keyframe_type_label label')
			if (label && selectedKeyframe.channel) {
				const property = selectedKeyframe.animator.channels[selectedKeyframe.channel]
				label.text(translate('panel.keyframe.keyframe_title', `${property.name}`))
			}
			currentPanel?.$destroy()
			currentPanel = comp
		},
	})
}

EVENTS.SELECT_KEYFRAME.subscribe(kf => {
	injectCustomKeyframePanel(kf)
})
