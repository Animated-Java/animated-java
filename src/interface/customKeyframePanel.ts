import CustomKeyframePanelSvelteComponent from '../components/customKeyframePanel.svelte'
import { CUSTOM_CHANNELS } from '../mods/customKeyframesMod'
import { events } from '../util/events'
import { injectSvelteCompomponent } from '../util/injectSvelte'
import { Valuable } from '../util/stores'
import { translate } from '../util/translation'

const CURRENT_PANEL = new Valuable<HTMLDivElement | undefined>(undefined)

export function injectCustomKeyframePanel(selectedKeyframe: _Keyframe) {
	injectSvelteCompomponent({
		svelteComponent: CustomKeyframePanelSvelteComponent,
		svelteComponentProperties: { currentPanel: CURRENT_PANEL, selectedKeyframe },
		elementFinder() {
			return document.querySelector('#panel_keyframe .panel_vue_wrapper .keyframe_data_point')
		},
	})
}

events.SELECT_KEYFRAME.subscribe(kf => {
	CURRENT_PANEL.get()?.remove()

	const label = jQuery('#panel_keyframe .panel_vue_wrapper #keyframe_type_label label')
	if (label && kf.channel) {
		const property = EffectAnimator.prototype.channels[kf.channel]
		label.text(translate('panel.keyframe.keyframe_title', `${property.name}`))
	}

	if (CUSTOM_CHANNELS.includes(kf.channel)) {
		injectCustomKeyframePanel(kf)
	}
})
