import CustomKeyframePanelSvelteComponent from '../components/customKeyframePanel.svelte'
import { CUSTOM_CHANNELS } from '../mods/customKeyframesMod'
import { events } from '../util/events'
import { injectSvelteCompomponent } from '../util/injectSvelteComponent'
import { Valuable } from '../util/stores'
import { translate } from '../util/translation'

const CURRENT_PANEL = new Valuable<HTMLDivElement | undefined>(undefined)

export function injectCustomKeyframePanel(selectedKeyframe: _Keyframe) {
	if (!CUSTOM_CHANNELS.includes(selectedKeyframe.channel)) return

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
			currentPanel: CURRENT_PANEL as Valuable<HTMLDivElement>,
			selectedKeyframe,
		},
		elementSelector() {
			return element
		},
		postMount() {
			const label = jQuery('#panel_keyframe .panel_vue_wrapper #keyframe_type_label label')
			if (label && selectedKeyframe.channel) {
				const property = selectedKeyframe.animator.channels[selectedKeyframe.channel]
				label.text(translate('panel.keyframe.keyframe_title', `${property.name}`))
			}
		},
	})
}

events.SELECT_KEYFRAME.subscribe(kf => {
	CURRENT_PANEL.get()?.remove()
	requestAnimationFrame(() => injectCustomKeyframePanel(kf))
})
