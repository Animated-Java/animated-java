import { BLUEPRINT_FORMAT } from '../blueprintFormat'
import BoneConfigDialogSvelteComponent from '../components/boneConfigDialog.svelte'
import { PACKAGE } from '../constants'
import { createAction } from '../util/moddingTools'
import { Valuable } from '../util/stores'
import { SvelteDialog } from '../util/svelteDialog'
import { translate } from '../util/translation'

export function openBoneConfigDialog(bone: Group) {
	const inheritSettings = new Valuable(bone.inherit_settings)
	const useNBT = new Valuable(bone.use_nbt)
	const glowing = new Valuable(bone.glowing)
	const glowColor = new Valuable(bone.glow_color)
	const shadowRadius = new Valuable(bone.shadow_radius)
	const shadowStrength = new Valuable(bone.shadow_strength)
	const brightnessOverride = new Valuable(bone.brightness_override)
	const enchanted = new Valuable(bone.enchanted)
	const invisible = new Valuable(bone.invisible)
	const nbt = new Valuable(bone.nbt)

	new SvelteDialog({
		id: `${PACKAGE.name}:bone_config`,
		title: translate('dialog.bone_config.title'),
		width: 400,
		svelteComponent: BoneConfigDialogSvelteComponent,
		svelteComponentProperties: {
			inheritSettings,
			useNBT,
			glowing,
			glowColor,
			shadowRadius,
			shadowStrength,
			brightnessOverride,
			enchanted,
			invisible,
			nbt,
		},
		onConfirm: () => {
			bone.inherit_settings = inheritSettings.get()
			bone.use_nbt = useNBT.get()
			bone.glowing = glowing.get()
			bone.glow_color = glowColor.get()
			bone.shadow_radius = shadowRadius.get()
			bone.shadow_strength = shadowStrength.get()
			bone.brightness_override = brightnessOverride.get()
			bone.enchanted = enchanted.get()
			bone.invisible = invisible.get()
			bone.nbt = nbt.get()
		},
	}).show()
}

export const BONE_CONFIG_ACTION = createAction(`${PACKAGE.name}:bone_config`, {
	icon: 'settings',
	name: translate('action.open_bone_config.name'),
	condition: () => Format === BLUEPRINT_FORMAT,
	click: () => {
		openBoneConfigDialog(Group.selected)
	},
})
