import { registerPatch } from 'blockbench-patch-manager'
import { injectComponent } from 'svelte-patching-tools'
import { EFFECT_ANIMATOR_CHANNELS } from '../../mods/customKeyframes'
import EVENTS from '../../util/events'
import { localize as translate } from '../../util/lang'
import CommandsKeyframePanel from './commandsKeyframe.svelte'
import VariantKeyframePanel from './variantKeyframe.svelte'

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

		// if (!activeProjectIsBlueprintFormat()) return

		const keyframe = Timeline.selected.at(0)
		if (keyframe) {
			let component: any
			switch (keyframe.channel) {
				case EFFECT_ANIMATOR_CHANNELS.VARIANT:
					component = VariantKeyframePanel
					break

				case EFFECT_ANIMATOR_CHANNELS.FUNCTION:
					component = CommandsKeyframePanel
					break

				default:
					currentUpdatePromise = null
					resolve()
					return
			}

			unmountCallback = injectComponent({
				component,
				props: { keyframe },
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
	id: 'animated_java:panel/custom-keyframe-data-points',

	apply: () => {
		// @ts-expect-error - Broken BB types
		Language.data['timeline.variant'] = translate('effect_animator.timeline.variant')
		// @ts-expect-error - Broken BB types
		Language.data['timeline.function'] = translate('effect_animator.timeline.function')

		const unsubs = [
			EVENTS.UPDATE_KEYFRAME_SELECTION.subscribe(() => void updatePanel()),
			EVENTS.UNSELECT_AJ_PROJECT.subscribe(() => void updatePanel()),
		]

		return { unsubs }
	},

	revert: async ({ unsubs }) => {
		// @ts-expect-error - Broken BB types
		delete Language.data['timeline.variant']
		// @ts-expect-error - Broken BB types
		delete Language.data['timeline.function']

		unsubs.forEach(unsub => unsub())
		await unmountCallback?.()
	},
})
