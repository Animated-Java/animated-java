import CommandsKeyframePanel from 'src/components/keyframePanels/commandsKeyframePanel.svelte'
import VariantKeyframePanel from 'src/components/keyframePanels/variantKeyframePanel.svelte'
import { EFFECT_ANIMATOR_CHANNELS, isCustomKeyframeChannel } from 'src/mods/customKeyframes'
import EVENTS from 'src/util/events'
import { registerMod } from 'src/util/moddingTools'
import { translate } from 'src/util/translation'
import { mountSvelteComponent } from '../../util/mountSvelteComponent'

registerMod({
	id: 'animated-java:panel/custom-keyframe-data-points',

	apply: () => {
		Language.data['timeline.variant'] = translate('effect_animator.timeline.variant')
		Language.data['timeline.function'] = translate('effect_animator.timeline.function')

		let mounted: VariantKeyframePanel | CommandsKeyframePanel | undefined

		const unsubs = [
			EVENTS.UPDATE_KEYFRAME_SELECTION.subscribe(() => {
				mounted?.$destroy()
				mounted = undefined

				const keyframe = Timeline.selected.at(0)
				const isCustomKeyframe = isCustomKeyframeChannel(keyframe?.channel ?? '')

				if (keyframe && isCustomKeyframe) {
					let component: any
					switch (keyframe.channel) {
						case EFFECT_ANIMATOR_CHANNELS.VARIANT:
							component = VariantKeyframePanel
							break

						case EFFECT_ANIMATOR_CHANNELS.FUNCTION:
							component = CommandsKeyframePanel
							break

						default:
							console.error(`Unknown custom keyframe channel: '${keyframe.channel}'`)
							return
					}

					mounted = mountSvelteComponent({
						component,
						props: { keyframe },
						target: '#panel_keyframe .panel_vue_wrapper .keyframe_data_point',
						hideTargetChildren: true,
					})
				}
			}),

			EVENTS.UNSELECT_AJ_PROJECT.subscribe(() => {
				mounted?.$destroy()
				mounted = undefined
			}),
		]

		return { mounted, unsubs }
	},

	revert: ({ mounted, unsubs }) => {
		delete Language.data['timeline.variant']
		delete Language.data['timeline.function']

		unsubs.forEach(unsub => unsub())
		mounted?.$destroy()
	},
})
