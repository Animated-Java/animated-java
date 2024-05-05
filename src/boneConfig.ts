import { NbtByte, NbtCompound, NbtFloat, NbtInt, NbtString, NbtTag } from 'deepslate'
import {
	IBlueprintVariantBoneConfigJSON,
	IBlueprintVariantCameraConfigJSON,
	IBlueprintVariantLocatorConfigJSON,
} from './blueprintFormat'

export class BoneConfig {
	public billboard: 'fixed' | 'vertical' | 'horizontal' | 'center' = 'fixed'
	public overrideBrightness = false
	public brightnessOverride = 0
	public enchanted = false
	public glowing = false
	public overrideGlowColor = false
	public glowColor = '#ffffff'
	public inheritSettings = true
	public invisible = false
	public nbt = '{}'
	public shadowRadius = 0
	public shadowStrength = 1
	public useNBT = false

	public checkIfEqual(other: BoneConfig) {
		return (
			this.billboard === other.billboard &&
			this.overrideBrightness === other.overrideBrightness &&
			this.brightnessOverride === other.brightnessOverride &&
			this.enchanted === other.enchanted &&
			this.glowing === other.glowing &&
			this.overrideGlowColor === other.overrideGlowColor &&
			this.glowColor === other.glowColor &&
			this.inheritSettings === other.inheritSettings &&
			this.invisible === other.invisible &&
			this.nbt === other.nbt &&
			this.shadowRadius === other.shadowRadius &&
			this.shadowStrength === other.shadowStrength &&
			this.useNBT === other.useNBT
		)
	}

	public isDefault(): boolean {
		return this.checkIfEqual(new BoneConfig())
	}

	public toJSON(): IBlueprintVariantBoneConfigJSON {
		return {
			billboard: this.billboard,
			override_brightness: this.overrideBrightness,
			brightness_override: this.brightnessOverride,
			enchanted: this.enchanted,
			glowing: this.glowing,
			override_glow_color: this.overrideGlowColor,
			glow_color: this.glowColor,
			inherit_settings: this.inheritSettings,
			invisible: this.invisible,
			nbt: this.nbt,
			shadow_radius: this.shadowRadius,
			shadow_strength: this.shadowStrength,
			use_nbt: this.useNBT,
		}
	}

	public static fromJSON(json: IBlueprintVariantBoneConfigJSON): BoneConfig {
		const config = new BoneConfig()
		if (json.billboard != undefined) config.billboard = json.billboard
		if (json.override_brightness != undefined)
			config.overrideBrightness = json.override_brightness
		if (json.brightness_override != undefined)
			config.brightnessOverride = json.brightness_override
		if (json.enchanted != undefined) config.enchanted = json.enchanted
		if (json.glowing != undefined) config.glowing = json.glowing
		if (json.override_glow_color != undefined)
			config.overrideGlowColor = json.override_glow_color
		if (json.glow_color != undefined) config.glowColor = json.glow_color
		if (json.inherit_settings != undefined) config.inheritSettings = json.inherit_settings
		if (json.invisible != undefined) config.invisible = json.invisible
		if (json.nbt != undefined) config.nbt = json.nbt
		if (json.shadow_radius != undefined) config.shadowRadius = json.shadow_radius
		if (json.shadow_strength != undefined) config.shadowStrength = json.shadow_strength
		if (json.use_nbt != undefined) config.useNBT = json.use_nbt
		return config
	}

	public toNBT(compound: NbtCompound = new NbtCompound()): NbtCompound {
		if (this.useNBT) {
			const newData = NbtTag.fromString(this.nbt) as NbtCompound
			for (const key of newData.keys()) {
				compound.set(key, newData.get(key)!)
			}
			return compound
		}

		const defaultConfig = new BoneConfig()

		if (this.billboard !== defaultConfig.billboard) {
			compound.set('billboard', new NbtString(this.billboard))
		}

		if (this.overrideBrightness) {
			compound.set(
				'brightness',
				new NbtCompound()
					.set('block', new NbtFloat(this.brightnessOverride))
					.set('sky', new NbtFloat(this.brightnessOverride))
			)
		}

		if (this.enchanted) {
			compound.set(
				'item',
				new NbtCompound().set(
					'components',
					new NbtCompound().set(
						'minecraft:enchantments',
						new NbtCompound().set(
							'levels',
							new NbtCompound().set('minecraft:infinity', new NbtInt(1))
						)
					)
				)
			)
		}

		if (this.glowing) {
			compound.set('Glowing', new NbtByte(Number(this.glowing)))
		}
		if (this.overrideGlowColor) {
			compound.set(
				'glow_color_override',
				new NbtInt(Number(this.glowColor.replace('#', '0x')))
			)
		}

		// TODO Figure out a good solution for toggling a bone's visibility...
		// if (force || config.invisible !== defaultConfig.invisible) {
		// 	compound.set('invisible', new NbtByte(1))
		// }

		if (this.shadowRadius !== defaultConfig.shadowRadius) {
			compound.set('shadow_radius', new NbtFloat(this.shadowRadius))
		}

		if (this.shadowStrength !== defaultConfig.shadowStrength) {
			compound.set('shadow_strength', new NbtFloat(this.shadowStrength))
		}

		return compound
	}
}

export class LocatorConfig {
	public tickingCommands = ''

	public toJSON(): IBlueprintVariantLocatorConfigJSON {
		return {
			ticking_commands: this.tickingCommands,
		}
	}

	public static fromJSON(json: IBlueprintVariantLocatorConfigJSON): LocatorConfig {
		const config = new LocatorConfig()
		if (json.ticking_commands != undefined) config.tickingCommands = json.ticking_commands
		return config
	}

	public isDefault(): boolean {
		return this.checkIfEqual(new LocatorConfig())
	}

	public checkIfEqual(other: LocatorConfig) {
		return this.tickingCommands === other.tickingCommands
	}
}

export class CameraConfig {
	public entityType = 'minecraft:item_display'
	public nbt = '{}'
	public tickingCommands = ''

	public toJSON(): IBlueprintVariantCameraConfigJSON {
		return {
			entity_type: this.entityType,
			nbt: this.nbt,
			ticking_commands: this.tickingCommands,
		}
	}

	public static fromJSON(json: IBlueprintVariantCameraConfigJSON): CameraConfig {
		const config = new CameraConfig()
		if (json.entity_type != undefined) config.entityType = json.entity_type
		if (json.nbt != undefined) config.nbt = json.nbt
		if (json.ticking_commands != undefined) config.tickingCommands = json.ticking_commands
		return config
	}

	public isDefault(): boolean {
		return this.checkIfEqual(new CameraConfig())
	}

	public checkIfEqual(other: CameraConfig) {
		return (
			this.entityType === other.entityType &&
			this.nbt === other.nbt &&
			this.tickingCommands === other.tickingCommands
		)
	}
}
