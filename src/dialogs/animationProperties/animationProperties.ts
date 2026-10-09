import { observable } from 'svelte-observable-store'
import { SvelteDialog } from 'svelte-patching-tools/blockbench'
import { PACKAGE } from '../../constants'
import { localize as translate } from '../../util/lang'
import AniamtionPropertiesSvelteComponent from './animationProperties.svelte'

export const DIALOG_ID = `${PACKAGE.name}:animationPropertiesDialog`

export function openAnimationPropertiesDialog(animation: _Animation) {
	const animationName = observable(animation.name)
	const loopMode = observable(animation.loop as string)
	const loopDelay = observable(Number(animation.loop_delay) || 0)
	const excludedNodes = observable(animation.excluded_nodes)
	const previewVariants = observable([...animation.preview_variants])
	const previewTextureSlots = observable({ ...animation.preview_texture_slots })

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
			previewVariants,
			previewTextureSlots,
		},
		disableKeybinds: true,
		onConfirm() {
			animation.name = animationName.get()
			animation.createUniqueName(Blockbench.Animation.all)
			animation.loop = loopMode.get() as any
			animation.loop_delay = loopDelay.get().toString()
			animation.excluded_nodes = excludedNodes.get()
			animation.preview_variants = previewVariants.get()
			animation.preview_texture_slots = previewTextureSlots.get()
			Animator.preview()

			Project!.saved = false
		},
	}).show()
}
