import type { SvelteComponentDev } from 'svelte/internal'
import { isCurrentFormat } from '../../blueprintFormat'
import CustomKeyframePanelSvelteComponent from '../../components/customKeyframePanel.svelte'
import { CUSTOM_CHANNELS } from '../../mods/customKeyframesMod'
import { events } from '../../util/events'
import { injectSvelteCompomponent } from '../../util/injectSvelteComponent'
import { translate } from '../../util/translation'

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

events.SELECT_KEYFRAME.subscribe(kf => {
	injectCustomKeyframePanel(kf)
})
