import { BLUEPRINT_FORMAT } from '../blueprintFormat'
import { BoneConfig } from '../boneConfig'
import BoneConfigDialogSvelteComponent from '../components/boneConfigDialog.svelte'
import { PACKAGE } from '../constants'
import { createAction } from '../util/moddingTools'
import { Valuable } from '../util/stores'
import { SvelteDialog } from '../util/svelteDialog'
import { translate } from '../util/translation'
import { Variant } from '../variants'

// TODO: These should probably be part of the BoneConfig class
function propagateInheritanceUp(group: Group, config: BoneConfig, variant?: string): void {
	// Recurse to the topmost parent that doesn't have inherit_settings enabled, then inherit down from there
	if (group.parent instanceof Group) {
		const parentConfig = variant ? group.configs.variants[variant] : group.configs.default
		if (parentConfig) {
			console.log('propagating inheritance up', group.name)
			if (parentConfig.inherit_settings) {
				propagateInheritanceUp(group.parent, config, variant)
			}
			const parentBoneConfig = BoneConfig.fromJSON(parentConfig)
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
			console.log('propagating inheritance down', child.name)
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

	const billboard = new Valuable(oldConfig.billboard)
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
		svelteComponent: BoneConfigDialogSvelteComponent,
		svelteComponentProperties: {
			variant: Variant.selected,
			parentConfig,
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

			newConfig.billboard = billboard.get()
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
		openBoneConfigDialog(Group.selected)
	},
})
