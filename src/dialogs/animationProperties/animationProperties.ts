import { observable } from 'svelte-observable-store'
import { SvelteDialog } from 'svelte-patching-tools/blockbench'
import { PACKAGE } from '../../constants'
import { translate } from '../../util/translation'
import AniamtionPropertiesSvelteComponent from './animationProperties.svelte'

export const DIALOG_ID = `${PACKAGE.name}:animationPropertiesDialog`

export function openAnimationPropertiesDialog(animation: _Animation) {
	const animationName = observable(animation.name)
	const loopMode = observable(animation.loop as string)
	const loopDelay = observable(Number(animation.loop_delay) || 0)
	const excludedNodes = observable(animation.excluded_nodes)

	new SvelteDialog({
		id: DIALOG_ID,
		title: translate('dialog.animation_properties.title', animation.name),
		width: 600,
		component: AniamtionPropertiesSvelteComponent,
		props: {
			animationName,
			loopMode,
			loopDelay,
			excludedNodes,
		},
		disableKeybinds: true,
		onConfirm() {
			animation.name = animationName.get()
			animation.createUniqueName(Blockbench.Animation.all)
			animation.loop = loopMode.get() as any
			animation.loop_delay = loopDelay.get().toString()
			animation.excluded_nodes = excludedNodes.get()

			Project!.saved = false
		},
	}).show()
}
