import AniamtionPropertiesSvelteComponent from '../../components/animationProperties.svelte'
import { PACKAGE } from '../../constants'
import { Valuable } from '../../util/stores'
import { SvelteDialog } from '../../util/svelteDialog'
import { translate } from '../../util/translation'

export const DIALOG_ID = `${PACKAGE.name}:animationPropertiesDialog`

export function openAnimationPropertiesDialog(animation: _Animation) {
	const animationName = new Valuable(animation.name)
	const loopMode = new Valuable(animation.loop as string)
	const loopDelay = new Valuable(Number(animation.loop_delay) || 0)
	const excludedNodes = new Valuable(animation.excluded_nodes)

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
		preventKeybinds: true,
		onConfirm() {
			animation.name = animationName.get()
			animation.createUniqueName(Blockbench.Animation.all)
			animation.loop = loopMode.get() as any
			animation.loop_delay = loopDelay.get().toString()
			animation.excluded_nodes = excludedNodes.get()
		},
	}).show()
}
