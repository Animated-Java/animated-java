import { registerPatch } from 'blockbench-patch-manager'
import { injectComponent } from 'svelte-patching-tools'
import { EFFECT_ANIMATOR_CHANNELS, isCustomKeyframeChannel } from '../../mods/customKeyframes'
import EVENTS from '../../util/events'
import { localize as translate } from '../../util/lang'
import CommandsKeyframePanel from './commandsKeyframe.svelte'
import VariantKeyframePanel from './variantKeyframe.svelte'

let unmountCallback: (() => Promise<void>) | null = null

registerPatch({
	id: 'animated_java:panel/custom-keyframe-data-points',

	apply: () => {
		Language.data['timeline.variant'] = translate('effect_animator.timeline.variant')
		Language.data['timeline.function'] = translate('effect_animator.timeline.function')

		const unsubs = [
			EVENTS.UPDATE_KEYFRAME_SELECTION.subscribe(async () => {
				await unmountCallback?.()
				unmountCallback = null

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

					unmountCallback = injectComponent({
						component,
						props: { keyframe },
						elementSelector(): HTMLElement | null {
							return document.querySelector(
								'#panel_keyframe .panel_vue_wrapper .keyframe_data_point'
							)
						},
						// hideTargetChildren: true,
					})
				}
			}),

			EVENTS.UNSELECT_AJ_PROJECT.subscribe(async () => {
				await unmountCallback?.()
				unmountCallback = null
			}),
		]

		return { unsubs }
	},

	revert: async ({ unsubs }) => {
		delete Language.data['timeline.variant']
		delete Language.data['timeline.function']

		unsubs.forEach(unsub => unsub())
		await unmountCallback?.()
	},
})
