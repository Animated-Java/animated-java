import AniamtionPropertiesSvelteComponent from '../components/animationProperties.svelte'
import { PACKAGE } from '../constants'
import { Valuable } from '../util/stores'
import { SvelteDialog } from '../util/svelteDialog'
import { translate } from '../util/translation'

export function openAnimationPropertiesDialog(animation: _Animation) {
	const animationName = new Valuable(animation.name)
	const loopMode = new Valuable(animation.loop)
	const excludedBones = new Valuable(animation.excluded_bones)

	new SvelteDialog({
		id: `${PACKAGE.name}:animationPropertiesDialog`,
		title: translate('dialog.animation_properties.title', animation.name),
		width: 600,
		svelteComponent: AniamtionPropertiesSvelteComponent,
		svelteComponentProperties: {
			animationName,
			loopMode,
			excludedBones,
		},
		preventKeybinds: true,
		onConfirm() {
			animation.name = animationName.get()
			animation.createUniqueName(Blockbench.Animation.all)
			animation.loop = loopMode.get()
			animation.excluded_bones = excludedBones.get()
		},
	}).show()
}

// export const ANIMATION_PROPERTIES_ACTION = createAction(`${PACKAGE.name}:bone_config`, {
// 	icon: 'settings',
// 	name: translate('action.open_bone_config.name'),
// 	condition: () => Format === BLUEPRINT_FORMAT,
// 	click: () => {
// 		if (!Blockbench.Animation.selected) return
// 		openBoneConfigDialog(Blockbench.Animation.selected)
// 	},
// })
