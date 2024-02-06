import { IBlueprintVariantBoneConfigJSON } from './blueprintFormat'

export class BoneConfig {
	public bone: Group

	public inheritSettings = true
	public useNBT = false
	public glowing = false
	public glowColor = '#ffffff'
	public shadowRadius = 0
	public shadowStrength = 1
	public brightnessOverride = 0
	public enchanted = false
	public invisible = false
	public nbt = '{}'

	constructor(bone: Group) {
		this.bone = bone
	}

	public checkIfEqual(other: BoneConfig) {
		return (
			this.inheritSettings === other.inheritSettings &&
			this.useNBT === other.useNBT &&
			this.glowing === other.glowing &&
			this.glowColor === other.glowColor &&
			this.shadowRadius === other.shadowRadius &&
			this.shadowStrength === other.shadowStrength &&
			this.brightnessOverride === other.brightnessOverride &&
			this.enchanted === other.enchanted &&
			this.invisible === other.invisible &&
			this.nbt === other.nbt
		)
	}

	public toJSON(): IBlueprintVariantBoneConfigJSON {
		return {
			inherit_settings: this.inheritSettings,
			use_nbt: this.useNBT,
			glowing: this.glowing,
			glow_color: this.glowColor,
			shadow_radius: this.shadowRadius,
			shadow_strength: this.shadowStrength,
			brightness_override: this.brightnessOverride,
			enchanted: this.enchanted,
			invisible: this.invisible,
			nbt: this.nbt,
		}
	}

	public fromJSON(json: IBlueprintVariantBoneConfigJSON): BoneConfig {
		this.inheritSettings = json.inherit_settings
		this.useNBT = json.use_nbt
		this.glowing = json.glowing
		this.glowColor = json.glow_color
		this.shadowRadius = json.shadow_radius
		this.shadowStrength = json.shadow_strength
		this.brightnessOverride = json.brightness_override
		this.enchanted = json.enchanted
		this.invisible = json.invisible
		this.nbt = json.nbt
		return this
	}
}
