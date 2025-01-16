import { BLUEPRINT_FORMAT } from '../../blueprintFormat'
import { BoneConfig } from '../../nodeConfigs'
import BoneConfigDialogSvelteComponent from '../../components/boneConfigDialog.svelte'
import { PACKAGE } from '../../constants'
import { createAction } from '../../util/moddingTools'
import { Valuable } from '../../util/stores'
import { SvelteDialog } from '../../util/svelteDialog'
import { translate } from '../../util/translation'
import { Variant } from '../../variants'

// TODO: These should probably be part of the BoneConfig class
function propagateInheritanceUp(group: Group, config: BoneConfig, variant?: string): void {
	// Recurse to the topmost parent that doesn't have inherit_settings enabled, then inherit down from there
	if (group.parent instanceof Group) {
		const parentConfig = variant
			? group.parent.configs.variants[variant]
			: group.parent.configs.default
		if (parentConfig) {
			const parentBoneConfig = BoneConfig.fromJSON(parentConfig)
			if (parentConfig.inherit_settings) {
				propagateInheritanceUp(group.parent, parentBoneConfig, variant)
			}
			config.inheritFrom(parentBoneConfig)
			if (variant) group.configs.variants[variant] = config.toJSON()
			else group.configs.default = config.toJSON()
		}
	}
}

function propagateInheritanceDown(group: Group, config: BoneConfig, variant?: string) {
	for (const child of group.children) {
		if (!(child instanceof Group)) continue
		const childConfig = variant ? child.configs.variants[variant] : child.configs.default
		if (childConfig && childConfig.inherit_settings) {
			const childBoneConfig = BoneConfig.fromJSON(childConfig)
			childBoneConfig.inheritFrom(config)
			if (variant) child.configs.variants[variant] = childBoneConfig.toJSON()
			else child.configs.default = childBoneConfig.toJSON()
			propagateInheritanceDown(child, childBoneConfig, variant)
		}
	}
}

export function openBoneConfigDialog(bone: Group) {
	// Blockbench's JSON stringifier doesn't handle custom toJSON functions, so I'm storing the config JSON in the bone instead of the actual BoneConfig object
	let boneConfigJSON = (bone.configs.default ??= new BoneConfig().toJSON())
	let parentConfigJSON =
		bone.parent instanceof Group
			? (bone.parent.configs.default ??= new BoneConfig().toJSON())
			: undefined

	if (Variant.selected && !Variant.selected.isDefault) {
		// Get the variant's config, or create a new one if it doesn't exist
		boneConfigJSON = bone.configs.variants[Variant.selected.uuid] ??= new BoneConfig().toJSON()
		parentConfigJSON =
			bone.parent instanceof Group
				? (bone.parent.configs.variants[Variant.selected.uuid] ??=
						new BoneConfig().toJSON())
				: undefined
	}

	const parentConfig = parentConfigJSON
		? BoneConfig.fromJSON(parentConfigJSON)
		: BoneConfig.getDefault()

	const oldConfig = BoneConfig.fromJSON(boneConfigJSON)

	const customName = new Valuable(oldConfig.customName)
	const customNameVisible = new Valuable(oldConfig.customNameVisible)
	const billboard = new Valuable(oldConfig.billboard as string)
	const overrideBrightness = new Valuable(oldConfig.overrideBrightness)
	const brightnessOverride = new Valuable(oldConfig.brightnessOverride)
	const enchanted = new Valuable(oldConfig.enchanted)
	const glowing = new Valuable(oldConfig.glowing)
	const overrideGlowColor = new Valuable(oldConfig.overrideGlowColor)
	const glowColor = new Valuable(oldConfig.glowColor)
	const inheritSettings = new Valuable(oldConfig.inheritSettings)
	const invisible = new Valuable(oldConfig.invisible)
	const nbt = new Valuable(oldConfig.nbt)
	const shadowRadius = new Valuable(oldConfig.shadowRadius)
	const shadowStrength = new Valuable(oldConfig.shadowStrength)
	const useNBT = new Valuable(oldConfig.useNBT)

	new SvelteDialog({
		id: `${PACKAGE.name}:boneConfig`,
		title: translate('dialog.bone_config.title'),
		width: 400,
		component: BoneConfigDialogSvelteComponent,
		props: {
			variant: Variant.selected!,
			customName,
			customNameVisible,
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
			const newConfig = new BoneConfig()

			newConfig.customName = customName.get()
			newConfig.customNameVisible = customNameVisible.get()
			newConfig.billboard = billboard.get() as any
			newConfig.overrideBrightness = overrideBrightness.get()
			newConfig.brightnessOverride = brightnessOverride.get()
			newConfig.enchanted = enchanted.get()
			newConfig.glowing = glowing.get()
			newConfig.overrideGlowColor = overrideGlowColor.get()
			newConfig.glowColor = glowColor.get()
			newConfig.inheritSettings = inheritSettings.get()
			newConfig.invisible = invisible.get()
			newConfig.nbt = nbt.get()
			newConfig.shadowRadius = shadowRadius.get()
			newConfig.shadowStrength = shadowStrength.get()
			newConfig.useNBT = useNBT.get()

			// Remove properties that are the same as the parent's
			newConfig.customName === parentConfig.customName && (newConfig.customName = undefined)
			newConfig.customNameVisible === parentConfig.customNameVisible &&
				(newConfig.customNameVisible = undefined)
			newConfig.billboard === parentConfig.billboard && (newConfig.billboard = undefined)
			newConfig.overrideBrightness === parentConfig.overrideBrightness &&
				(newConfig.overrideBrightness = undefined)
			newConfig.brightnessOverride === parentConfig.brightnessOverride &&
				(newConfig.brightnessOverride = undefined)
			newConfig.enchanted === parentConfig.enchanted && (newConfig.enchanted = undefined)
			newConfig.glowing === parentConfig.glowing && (newConfig.glowing = undefined)
			newConfig.overrideGlowColor === parentConfig.overrideGlowColor &&
				(newConfig.overrideGlowColor = undefined)
			newConfig.glowColor === parentConfig.glowColor && (newConfig.glowColor = undefined)
			newConfig.invisible === parentConfig.invisible && (newConfig.invisible = undefined)
			newConfig.nbt === parentConfig.nbt && (newConfig.nbt = undefined)
			newConfig.shadowRadius === parentConfig.shadowRadius &&
				(newConfig.shadowRadius = undefined)
			newConfig.shadowStrength === parentConfig.shadowStrength &&
				(newConfig.shadowStrength = undefined)
			newConfig.useNBT === parentConfig.useNBT && (newConfig.useNBT = undefined)

			if (newConfig.checkIfEqual(BoneConfig.fromJSON(bone.configs.default))) {
				// Don't save the variant config if it's the same as the default
				delete bone.configs.variants[Variant.selected!.uuid]
				return
			}

			if (Variant.selected && !Variant.selected.isDefault) {
				if (newConfig.inheritSettings) {
					propagateInheritanceUp(bone, newConfig, Variant.selected.uuid)
				}
				bone.configs.variants[Variant.selected.uuid] = newConfig.toJSON()
				propagateInheritanceDown(bone, newConfig, Variant.selected.uuid)
			} else {
				if (newConfig.inheritSettings) {
					propagateInheritanceUp(bone, newConfig)
				}
				bone.configs.default = newConfig.toJSON()
				propagateInheritanceDown(bone, newConfig)
			}
		},
	}).show()
}

export const BONE_CONFIG_ACTION = createAction(`${PACKAGE.name}:bone_config`, {
	icon: 'settings',
	name: translate('action.open_bone_config.name'),
	condition: () => Format === BLUEPRINT_FORMAT,
	click: () => {
		if (!Group.first_selected) return
		openBoneConfigDialog(Group.first_selected)
	},
})
