import { BLUEPRINT_FORMAT } from '../blueprintFormat'
import { BoneConfig } from '../boneConfig'
import BoneConfigDialogSvelteComponent from '../components/boneConfigDialog.svelte'
import { PACKAGE } from '../constants'
import { createAction } from '../util/moddingTools'
import { Valuable } from '../util/stores'
import { SvelteDialog } from '../util/svelteDialog'
import { translate } from '../util/translation'
import { Variant } from '../variants'

export function openBoneConfigDialog(bone: Group) {
	// Blockbench's JSON stringifier doesn't handle custom toJSON functions, so I'm storing the config JSON in the bone instead of the actual BoneConfig object
	let boneConfigJSON = (bone.configs.default ??= new BoneConfig().toJSON())

	if (Variant.selected && !Variant.selected.isDefault) {
		// Get the variant's config, or create a new one if it doesn't exist
		boneConfigJSON = bone.configs.variants[Variant.selected.uuid] ??= new BoneConfig().toJSON()
	}

	const boneConfig = BoneConfig.fromJSON(boneConfigJSON)

	const billboard = new Valuable(boneConfig.billboard)
	const overrideBrightness = new Valuable(boneConfig.overrideBrightness)
	const brightnessOverride = new Valuable(boneConfig.brightnessOverride)
	const enchanted = new Valuable(boneConfig.enchanted)
	const glowing = new Valuable(boneConfig.glowing)
	const overrideGlowColor = new Valuable(boneConfig.overrideGlowColor)
	const glowColor = new Valuable(boneConfig.glowColor)
	const inheritSettings = new Valuable(boneConfig.inheritSettings)
	const invisible = new Valuable(boneConfig.invisible)
	const nbt = new Valuable(boneConfig.nbt)
	const shadowRadius = new Valuable(boneConfig.shadowRadius)
	const shadowStrength = new Valuable(boneConfig.shadowStrength)
	const useNBT = new Valuable(boneConfig.useNBT)

	new SvelteDialog({
		id: `${PACKAGE.name}:boneConfig`,
		title: translate('dialog.bone_config.title'),
		width: 400,
		svelteComponent: BoneConfigDialogSvelteComponent,
		svelteComponentProperties: {
			variant: Variant.selected,
			billboard,
			overrideBrightness,
			brightnessOverride,
			enchanted,
			glowing,
			overrideGlowColor,
			glowColor,
			inheritSettings,
			invisible,
			nbt,
			shadowRadius,
			shadowStrength,
			useNBT,
		},
		preventKeybinds: true,
		onConfirm() {
			boneConfig.billboard = billboard.get()
			boneConfig.overrideBrightness = overrideBrightness.get()
			boneConfig.brightnessOverride = brightnessOverride.get()
			boneConfig.enchanted = enchanted.get()
			boneConfig.glowing = glowing.get()
			boneConfig.overrideGlowColor = overrideGlowColor.get()
			boneConfig.glowColor = glowColor.get()
			boneConfig.inheritSettings = inheritSettings.get()
			boneConfig.invisible = invisible.get()
			boneConfig.nbt = nbt.get()
			boneConfig.shadowRadius = shadowRadius.get()
			boneConfig.shadowStrength = shadowStrength.get()
			boneConfig.useNBT = useNBT.get()

			if (boneConfig.checkIfEqual(BoneConfig.fromJSON(bone.configs.default))) {
				// Don't save the variant config if it's the same as the default
				delete bone.configs.variants[Variant.selected!.uuid]
				return
			}

			if (Variant.selected && !Variant.selected.isDefault) {
				bone.configs.variants[Variant.selected.uuid] = boneConfig.toJSON()
			} else {
				bone.configs.default = boneConfig.toJSON()
			}
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
