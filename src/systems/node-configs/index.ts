import { NbtByte, NbtCompound, NbtFloat, NbtInt, NbtString, NbtTag } from 'deepslate'
import { SerializableConfig } from './serializableConfig'
export type { Serialized } from './serializableConfig'

@SerializableConfig.decorate
export class GenericDisplayConfig extends SerializableConfig<GenericDisplayConfig> {
	customName?: string
	customNameVisible?: boolean
	billboard?: BillboardMode
	overrideBrightness?: boolean
	brightnessOverride?: number
	enchanted?: boolean
	glowing?: boolean
	overrideGlowColor?: boolean
	glowColor?: string
	inheritSettings?: boolean
	invisible?: boolean
	nbt?: string
	shadowRadius?: number
	shadowStrength?: number
	useNBT?: boolean

	public toNBT(compound: NbtCompound = new NbtCompound()): NbtCompound {
		if (this.useNBT && this.nbt?.length) {
			const newData = NbtTag.fromString(this.nbt) as NbtCompound
			for (const key of newData.keys()) {
				compound.set(key, newData.get(key)!)
			}
			return compound
		}

		if (this.customName) {
			compound.set('CustomName', new NbtString(this.customName))
		}

		if (this.customNameVisible) {
			compound.set('CustomNameVisible', new NbtByte(Number(this.customNameVisible)))
		}

		if (this.billboard) {
			compound.set('billboard', new NbtString(this.billboard))
		}

		if (this.overrideBrightness && this.brightnessOverride != undefined) {
			compound.set(
				'brightness',
				new NbtCompound()
					.set('block', new NbtFloat(this.brightnessOverride))
					.set('sky', new NbtFloat(this.brightnessOverride))
			)
		}

		if (this.enchanted) {
			const item = (compound.get('item') as NbtCompound) || new NbtCompound()
			compound.set(
				'item',
				item.set(
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
		if (this.overrideGlowColor && this.glowColor != undefined) {
			compound.set(
				'glow_color_override',
				new NbtInt(Number(this.glowColor.replace('#', '0x')))
			)
		}

		// TODO Figure out a good solution for toggling a bone's visibility...
		// if (force || config.invisible !== defaultConfig.invisible) {
		// 	compound.set('invisible', new NbtByte(1))
		// }

		if (this.shadowRadius) {
			compound.set('shadow_radius', new NbtFloat(this.shadowRadius))
		}

		if (this.shadowStrength) {
			compound.set('shadow_strength', new NbtFloat(this.shadowStrength))
		}

		return compound
	}
}

@SerializableConfig.decorate
export class LocatorConfig extends SerializableConfig<LocatorConfig> {
	useEntity?: boolean
	entityType?: string
	syncPassengerRotation?: boolean
	summonCommands?: string
	tickingCommands?: string
}

@SerializableConfig.decorate
export class CameraConfig extends SerializableConfig<CameraConfig> {
	entityType?: string
	nbt?: string
	tickingCommands?: string
}

@SerializableConfig.decorate
export class TextDisplayConfig extends SerializableConfig<TextDisplayConfig> {
	billboard?: BillboardMode
	overrideBrightness?: boolean
	brightnessOverride?: number
	glowing?: boolean
	overrideGlowColor?: boolean
	glowColor?: string
	invisible?: boolean
	nbt?: string
	shadowRadius?: number
	shadowStrength?: number
	useNBT?: boolean

	public toNBT(compound = new NbtCompound()) {
		if (this.useNBT && this.nbt?.length) {
			const newData = NbtTag.fromString(this.nbt) as NbtCompound
			for (const key of newData.keys()) {
				compound.set(key, newData.get(key)!)
			}
			return compound
		}

		if (this.billboard) {
			compound.set('billboard', new NbtString(this.billboard))
		}

		if (this.overrideBrightness && this.brightnessOverride != undefined) {
			compound.set(
				'brightness',
				new NbtCompound()
					.set('block', new NbtFloat(this.brightnessOverride))
					.set('sky', new NbtFloat(this.brightnessOverride))
			)
		}

		if (this.glowing) {
			compound.set('Glowing', new NbtByte(Number(this.glowing)))
		}
		if (this.overrideGlowColor && this.glowColor != undefined) {
			compound.set(
				'glow_color_override',
				new NbtInt(Number(this.glowColor.replace('#', '0x')))
			)
		}

		// TODO Figure out a good solution for toggling a bone's visibility...
		// if (force || config.invisible !== defaultConfig.invisible) {
		// 	compound.set('invisible', new NbtByte(1))
		// }

		if (this.shadowRadius) {
			compound.set('shadow_radius', new NbtFloat(this.shadowRadius))
		}

		if (this.shadowStrength) {
			compound.set('shadow_strength', new NbtFloat(this.shadowStrength))
		}

		return compound
	}
}
