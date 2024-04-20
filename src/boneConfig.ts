import { IBlueprintVariantBoneConfigJSON } from './blueprintFormat'

export class BoneConfig {
	public bone: Group

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

	constructor(bone: Group) {
		this.bone = bone
	}

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
		this.billboard = json.billboard
		this.brightnessOverride = json.brightness_override
		this.enchanted = json.enchanted
		this.glowColor = json.glow_color
		this.glowing = json.glowing
		this.inheritSettings = json.inherit_settings
		this.invisible = json.invisible
		this.nbt = json.nbt
		this.shadowRadius = json.shadow_radius
		this.shadowStrength = json.shadow_strength
		this.useNBT = json.use_nbt
		return this
	}
}
