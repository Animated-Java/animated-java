import { IBlueprintVariantBoneConfigJSON } from './blueprintFormat'

export class BoneConfig {
	public billboard: 'fixed' | 'vertical' | 'horizontal' | 'center' = 'fixed'
	public brightnessOverride = 0
	public enchanted = false
	public glowColor = '#ffffff'
	public glowing = false
	public inheritSettings = true
	public invisible = false
	public nbt = '{}'
	public shadowRadius = 0
	public shadowStrength = 1
	public useNBT = false

	// constructor(public bone: Group) {
	// 	this.bone = bone
	// }

	public checkIfEqual(other: BoneConfig) {
		return (
			this.billboard === other.billboard &&
			this.brightnessOverride === other.brightnessOverride &&
			this.enchanted === other.enchanted &&
			this.glowColor === other.glowColor &&
			this.glowing === other.glowing &&
			this.inheritSettings === other.inheritSettings &&
			this.invisible === other.invisible &&
			this.nbt === other.nbt &&
			this.shadowRadius === other.shadowRadius &&
			this.shadowStrength === other.shadowStrength &&
			this.useNBT === other.useNBT
		)
	}

	public toJSON(): IBlueprintVariantBoneConfigJSON {
		return {
			billboard: this.billboard,
			brightness_override: this.brightnessOverride,
			enchanted: this.enchanted,
			glow_color: this.glowColor,
			glowing: this.glowing,
			inherit_settings: this.inheritSettings,
			invisible: this.invisible,
			nbt: this.nbt,
			shadow_radius: this.shadowRadius,
			shadow_strength: this.shadowStrength,
			use_nbt: this.useNBT,
		}
	}

	public fromJSON(json: IBlueprintVariantBoneConfigJSON): BoneConfig {
		if (json.billboard != undefined) this.billboard = json.billboard
		if (json.brightness_override != undefined)
			this.brightnessOverride = json.brightness_override
		if (json.enchanted != undefined) this.enchanted = json.enchanted
		if (json.glow_color != undefined) this.glowColor = json.glow_color
		if (json.glowing != undefined) this.glowing = json.glowing
		if (json.inherit_settings != undefined) this.inheritSettings = json.inherit_settings
		if (json.invisible != undefined) this.invisible = json.invisible
		if (json.nbt != undefined) this.nbt = json.nbt
		if (json.shadow_radius != undefined) this.shadowRadius = json.shadow_radius
		if (json.shadow_strength != undefined) this.shadowStrength = json.shadow_strength
		if (json.use_nbt != undefined) this.useNBT = json.use_nbt
		return this
	}
}
