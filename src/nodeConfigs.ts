import { NbtByte, NbtCompound, NbtFloat, NbtInt, NbtString, NbtTag } from 'deepslate/lib/nbt'
import type {
	IBlueprintBoneConfigJSON,
	IBlueprintLocatorConfigJSON,
	IBlueprintTextDisplayConfigJSON,
} from './formats/blueprint/format'
import { scrubUndefined } from './util/misc'

export type BillboardMode = 'fixed' | 'vertical' | 'horizontal' | 'center'

// TODO: Refactor these configs to inherit from a base class
export class BoneConfig {
	private __customName?: string
	private __customNameVisible?: boolean
	private __billboard?: BillboardMode
	private __overrideBrightness?: boolean
	private __brightnessOverride?: number
	private __enchanted?: boolean
	private __glowing?: boolean
	private __overrideGlowColor?: boolean
	private __glowColor?: string
	private __inheritSettings?: boolean
	private __invisible?: boolean
	private __nbt?: string
	private __shadowRadius?: number
	private __shadowStrength?: number
	private __useNBT?: boolean

	static getDefault(): BoneConfig {
		return BoneConfig.fromJSON({
			custom_name: '',
			custom_name_visible: false,
			billboard: 'fixed',
			override_brightness: false,
			brightness_override: 0,
			enchanted: false,
			glowing: false,
			override_glow_color: false,
			glow_color: '#ffffff',
			inherit_settings: true,
			invisible: false,
			nbt: '{}',
			shadow_radius: 0,
			shadow_strength: 1,
			use_nbt: false,
		})
	}

	get customName(): NonNullable<BoneConfig['__customName']> {
		if (this.__customName !== undefined) return this.__customName
		const defaultConfig = BoneConfig.getDefault()
		return defaultConfig.customName
	}
	set customName(value: BoneConfig['__customName']) {
		this.__customName = value
	}

	get customNameVisible(): NonNullable<BoneConfig['__customNameVisible']> {
		if (this.__customNameVisible !== undefined) return this.__customNameVisible
		const defaultConfig = BoneConfig.getDefault()
		return defaultConfig.customNameVisible
	}
	set customNameVisible(value: BoneConfig['__customNameVisible']) {
		this.__customNameVisible = value
	}

	get billboard(): NonNullable<BoneConfig['__billboard']> {
		if (this.__billboard !== undefined) return this.__billboard
		const defaultConfig = BoneConfig.getDefault()
		return defaultConfig.billboard
	}
	set billboard(value: BoneConfig['__billboard']) {
		this.__billboard = value
	}

	get overrideBrightness(): NonNullable<BoneConfig['__overrideBrightness']> {
		if (this.__overrideBrightness !== undefined) return this.__overrideBrightness
		const defaultConfig = BoneConfig.getDefault()
		return defaultConfig.overrideBrightness
	}
	set overrideBrightness(value: BoneConfig['__overrideBrightness']) {
		this.__overrideBrightness = value
	}

	get brightnessOverride(): NonNullable<BoneConfig['__brightnessOverride']> {
		if (this.__brightnessOverride !== undefined) return this.__brightnessOverride
		const defaultConfig = BoneConfig.getDefault()
		return defaultConfig.brightnessOverride
	}
	set brightnessOverride(value: BoneConfig['__brightnessOverride']) {
		this.__brightnessOverride = value
	}

	get enchanted(): NonNullable<BoneConfig['__enchanted']> {
		if (this.__enchanted !== undefined) return this.__enchanted
		const defaultConfig = BoneConfig.getDefault()
		return defaultConfig.enchanted
	}
	set enchanted(value: BoneConfig['__enchanted']) {
		this.__enchanted = value
	}

	get glowing(): NonNullable<BoneConfig['__glowing']> {
		if (this.__glowing !== undefined) return this.__glowing
		const defaultConfig = BoneConfig.getDefault()
		return defaultConfig.glowing
	}
	set glowing(value: BoneConfig['__glowing']) {
		this.__glowing = value
	}

	get overrideGlowColor(): NonNullable<BoneConfig['__overrideGlowColor']> {
		if (this.__overrideGlowColor !== undefined) return this.__overrideGlowColor
		const defaultConfig = BoneConfig.getDefault()
		return defaultConfig.overrideGlowColor
	}
	set overrideGlowColor(value: BoneConfig['__overrideGlowColor']) {
		this.__overrideGlowColor = value
	}

	get glowColor(): NonNullable<BoneConfig['__glowColor']> {
		if (this.__glowColor !== undefined) return this.__glowColor
		const defaultConfig = BoneConfig.getDefault()
		return defaultConfig.glowColor
	}
	set glowColor(value: BoneConfig['__glowColor']) {
		this.__glowColor = value
	}

	get inheritSettings(): NonNullable<BoneConfig['__inheritSettings']> {
		if (this.__inheritSettings !== undefined) return this.__inheritSettings
		const defaultConfig = BoneConfig.getDefault()
		return defaultConfig.inheritSettings
	}
	set inheritSettings(value: BoneConfig['__inheritSettings']) {
		this.__inheritSettings = value
	}

	get invisible(): NonNullable<BoneConfig['__invisible']> {
		if (this.__invisible !== undefined) return this.__invisible
		const defaultConfig = BoneConfig.getDefault()
		return defaultConfig.invisible
	}
	set invisible(value: BoneConfig['__invisible']) {
		this.__invisible = value
	}

	get nbt(): NonNullable<BoneConfig['__nbt']> {
		if (this.__nbt !== undefined) return this.__nbt
		const defaultConfig = BoneConfig.getDefault()
		return defaultConfig.nbt
	}
	set nbt(value: BoneConfig['__nbt']) {
		this.__nbt = value
	}

	get shadowRadius(): NonNullable<BoneConfig['__shadowRadius']> {
		if (this.__shadowRadius !== undefined) return this.__shadowRadius
		const defaultConfig = BoneConfig.getDefault()
		return defaultConfig.shadowRadius
	}
	set shadowRadius(value: BoneConfig['__shadowRadius']) {
		this.__shadowRadius = value
	}

	get shadowStrength(): NonNullable<BoneConfig['__shadowStrength']> {
		if (this.__shadowStrength !== undefined) return this.__shadowStrength
		const defaultConfig = BoneConfig.getDefault()
		return defaultConfig.shadowStrength
	}
	set shadowStrength(value: BoneConfig['__shadowStrength']) {
		this.__shadowStrength = value
	}

	get useNBT(): NonNullable<BoneConfig['__useNBT']> {
		if (this.__useNBT !== undefined) return this.__useNBT
		const defaultConfig = BoneConfig.getDefault()
		return defaultConfig.useNBT
	}
	set useNBT(value: BoneConfig['__useNBT']) {
		this.__useNBT = value
	}

	checkIfEqual(other: BoneConfig) {
		return (
			this.__customName === other.__customName &&
			this.__customNameVisible === other.__customNameVisible &&
			this.__billboard === other.__billboard &&
			this.__overrideBrightness === other.__overrideBrightness &&
			this.__brightnessOverride === other.__brightnessOverride &&
			this.__enchanted === other.__enchanted &&
			this.__glowing === other.__glowing &&
			this.__overrideGlowColor === other.__overrideGlowColor &&
			this.__glowColor === other.__glowColor &&
			this.__inheritSettings === other.__inheritSettings &&
			this.__invisible === other.__invisible &&
			this.__nbt === other.__nbt &&
			this.__shadowRadius === other.__shadowRadius &&
			this.__shadowStrength === other.__shadowStrength &&
			this.__useNBT === other.__useNBT
		)
	}

	isDefault(): boolean {
		return this.checkIfEqual(BoneConfig.getDefault())
	}

	toJSON(): IBlueprintBoneConfigJSON {
		return scrubUndefined({
			custom_name: this.__customName,
			custom_name_visible: this.__customNameVisible,
			billboard: this.__billboard,
			override_brightness: this.__overrideBrightness,
			brightness_override: this.__brightnessOverride,
			enchanted: this.__enchanted,
			glowing: this.__glowing,
			override_glow_color: this.__overrideGlowColor,
			glow_color: this.__glowColor,
			inherit_settings: this.__inheritSettings,
			invisible: this.__invisible,
			nbt: this.__nbt,
			shadow_radius: this.__shadowRadius,
			shadow_strength: this.__shadowStrength,
			use_nbt: this.__useNBT,
		})
	}

	inheritFrom(other: BoneConfig) {
		if (other.__customName !== undefined) this.customName = other.customName
		if (other.__customNameVisible !== undefined)
			this.customNameVisible = other.customNameVisible
		if (other.__billboard !== undefined) this.billboard = other.billboard
		if (other.__overrideBrightness !== undefined)
			this.overrideBrightness = other.overrideBrightness
		if (other.__brightnessOverride !== undefined)
			this.brightnessOverride = other.brightnessOverride
		if (other.__enchanted !== undefined) this.enchanted = other.enchanted
		if (other.__glowing !== undefined) this.glowing = other.glowing
		if (other.__overrideGlowColor !== undefined)
			this.overrideGlowColor = other.overrideGlowColor
		if (other.__glowColor !== undefined) this.glowColor = other.glowColor
		if (other.__inheritSettings !== undefined) this.inheritSettings = other.inheritSettings
		if (other.__invisible !== undefined) this.invisible = other.invisible
		if (other.__nbt !== undefined) this.nbt = other.nbt
		if (other.__shadowRadius !== undefined) this.shadowRadius = other.shadowRadius
		if (other.__shadowStrength !== undefined) this.shadowStrength = other.shadowStrength
		if (other.__useNBT !== undefined) this.useNBT = other.useNBT
	}

	static fromJSON(json: IBlueprintBoneConfigJSON): BoneConfig {
		const config = new BoneConfig()
		if (json.custom_name !== undefined) config.__customName = json.custom_name
		if (json.custom_name_visible !== undefined)
			config.__customNameVisible = json.custom_name_visible
		if (json.billboard !== undefined) config.__billboard = json.billboard
		if (json.override_brightness !== undefined)
			config.__overrideBrightness = json.override_brightness
		if (json.brightness_override !== undefined)
			config.__brightnessOverride = json.brightness_override
		if (json.enchanted !== undefined) config.__enchanted = json.enchanted
		if (json.glowing !== undefined) config.__glowing = json.glowing
		if (json.override_glow_color !== undefined)
			config.__overrideGlowColor = json.override_glow_color
		if (json.glow_color !== undefined) config.__glowColor = json.glow_color
		if (json.inherit_settings !== undefined) config.__inheritSettings = json.inherit_settings
		if (json.invisible !== undefined) config.__invisible = json.invisible
		if (json.nbt !== undefined) config.__nbt = json.nbt
		if (json.shadow_radius !== undefined) config.__shadowRadius = json.shadow_radius
		if (json.shadow_strength !== undefined) config.__shadowStrength = json.shadow_strength
		if (json.use_nbt !== undefined) config.__useNBT = json.use_nbt
		return config
	}

	toNBT(compound: NbtCompound = new NbtCompound()): NbtCompound {
		if (this.useNBT) {
			const newData = NbtTag.fromString(this.nbt) as NbtCompound
			for (const key of newData.keys()) {
				compound.set(key, newData.get(key)!)
			}
			return compound
		}

		if (this.__customName) {
			compound.set('CustomName', new NbtString(this.customName))
		}

		if (this.__customNameVisible) {
			compound.set('CustomNameVisible', new NbtByte(Number(this.customNameVisible)))
		}

		if (this.__billboard) {
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

		if (this.__shadowRadius) {
			compound.set('shadow_radius', new NbtFloat(this.shadowRadius))
		}

		if (this.__shadowStrength) {
			compound.set('shadow_strength', new NbtFloat(this.shadowStrength))
		}

		return compound
	}
}

export class LocatorConfig {
	private __useEntity?: boolean
	private __entityType?: string
	private __syncPassengerRotation?: boolean
	private __onSummonFunction?: string
	private __onTickFunction?: string

	getDefault(): LocatorConfig {
		return LocatorConfig.fromJSON({
			use_entity: false,
			entity_type: 'minecraft:pig',
			sync_passenger_rotation: false,
			on_summon_function: '',
			on_tick_function: '',
		})
	}

	get useEntity(): NonNullable<LocatorConfig['__useEntity']> {
		if (this.__useEntity !== undefined) return this.__useEntity
		const defaultConfig = this.getDefault()
		return defaultConfig.useEntity
	}
	set useEntity(value: NonNullable<LocatorConfig['__useEntity']>) {
		this.__useEntity = value
	}

	get entityType(): NonNullable<LocatorConfig['__entityType']> {
		if (this.__entityType !== undefined) return this.__entityType
		const defaultConfig = this.getDefault()
		return defaultConfig.entityType
	}
	set entityType(value: NonNullable<LocatorConfig['__entityType']>) {
		this.__entityType = value
	}

	get syncPassengerRotation(): NonNullable<LocatorConfig['__syncPassengerRotation']> {
		if (this.__syncPassengerRotation !== undefined) return this.__syncPassengerRotation
		const defaultConfig = this.getDefault()
		return defaultConfig.syncPassengerRotation
	}
	set syncPassengerRotation(value: NonNullable<LocatorConfig['__syncPassengerRotation']>) {
		this.__syncPassengerRotation = value
	}

	get onSummonFunction(): NonNullable<LocatorConfig['__onSummonFunction']> {
		if (this.__onSummonFunction !== undefined) return this.__onSummonFunction
		const defaultConfig = this.getDefault()
		return defaultConfig.onSummonFunction
	}
	set onSummonFunction(value: NonNullable<LocatorConfig['__onSummonFunction']>) {
		this.__onSummonFunction = value
	}

	get onTickFunction(): NonNullable<LocatorConfig['__onTickFunction']> {
		if (this.__onTickFunction !== undefined) return this.__onTickFunction
		const defaultConfig = this.getDefault()
		return defaultConfig.onTickFunction
	}
	set onTickFunction(value: NonNullable<LocatorConfig['__onTickFunction']>) {
		this.__onTickFunction = value
	}

	toJSON(): IBlueprintLocatorConfigJSON {
		return scrubUndefined({
			use_entity: this.__useEntity,
			entity_type: this.__entityType,
			sync_passenger_rotation: this.__syncPassengerRotation,
			on_summon_function: this.__onSummonFunction,
			on_tick_function: this.__onTickFunction,
		})
	}

	static fromJSON(json: IBlueprintLocatorConfigJSON): LocatorConfig {
		const config = new LocatorConfig()
		if (json.use_entity !== undefined) config.__useEntity = json.use_entity
		if (json.entity_type !== undefined) config.__entityType = json.entity_type
		if (json.sync_passenger_rotation !== undefined)
			config.__syncPassengerRotation = json.sync_passenger_rotation
		if (json.on_summon_function !== undefined)
			config.__onSummonFunction = json.on_summon_function
		if (json.on_tick_function !== undefined) config.__onTickFunction = json.on_tick_function
		return config
	}

	isDefault(): boolean {
		return this.checkIfEqual(new LocatorConfig())
	}

	checkIfEqual(other: LocatorConfig) {
		return (
			this.useEntity === other.useEntity &&
			this.entityType === other.entityType &&
			this.syncPassengerRotation === other.syncPassengerRotation &&
			this.onSummonFunction === other.onSummonFunction &&
			this.onTickFunction === other.onTickFunction
		)
	}
}

export class TextDisplayConfig {
	private __billboard?: BillboardMode
	private __overrideBrightness?: boolean
	private __brightnessOverride?: number
	private __glowing?: boolean
	private __overrideGlowColor?: boolean
	private __glowColor?: string
	private __invisible?: boolean
	private __shadowRadius?: number
	private __shadowStrength?: number
	private __useNBT?: boolean
	private __nbt?: string

	static getDefault(): TextDisplayConfig {
		return TextDisplayConfig.fromJSON({
			billboard: 'fixed',
			override_brightness: false,
			brightness_override: 0,
			glowing: false,
			override_glow_color: false,
			glow_color: '#ffffff',
			invisible: false,
			nbt: '{}',
			shadow_radius: 0,
			shadow_strength: 1,
			use_nbt: false,
		})
	}

	get billboard(): NonNullable<TextDisplayConfig['__billboard']> {
		if (this.__billboard !== undefined) return this.__billboard
		const defaultConfig = TextDisplayConfig.getDefault()
		return defaultConfig.billboard
	}
	set billboard(value: TextDisplayConfig['__billboard']) {
		this.__billboard = value
	}

	get overrideBrightness(): NonNullable<TextDisplayConfig['__overrideBrightness']> {
		if (this.__overrideBrightness !== undefined) return this.__overrideBrightness
		const defaultConfig = TextDisplayConfig.getDefault()
		return defaultConfig.overrideBrightness
	}
	set overrideBrightness(value: TextDisplayConfig['__overrideBrightness']) {
		this.__overrideBrightness = value
	}

	get brightnessOverride(): NonNullable<TextDisplayConfig['__brightnessOverride']> {
		if (this.__brightnessOverride !== undefined) return this.__brightnessOverride
		const defaultConfig = TextDisplayConfig.getDefault()
		return defaultConfig.brightnessOverride
	}
	set brightnessOverride(value: TextDisplayConfig['__brightnessOverride']) {
		this.__brightnessOverride = value
	}

	get glowing(): NonNullable<TextDisplayConfig['__glowing']> {
		if (this.__glowing !== undefined) return this.__glowing
		const defaultConfig = TextDisplayConfig.getDefault()
		return defaultConfig.glowing
	}
	set glowing(value: TextDisplayConfig['__glowing']) {
		this.__glowing = value
	}

	get overrideGlowColor(): NonNullable<TextDisplayConfig['__overrideGlowColor']> {
		if (this.__overrideGlowColor !== undefined) return this.__overrideGlowColor
		const defaultConfig = TextDisplayConfig.getDefault()
		return defaultConfig.overrideGlowColor
	}
	set overrideGlowColor(value: TextDisplayConfig['__overrideGlowColor']) {
		this.__overrideGlowColor = value
	}

	get glowColor(): NonNullable<TextDisplayConfig['__glowColor']> {
		if (this.__glowColor !== undefined) return this.__glowColor
		const defaultConfig = TextDisplayConfig.getDefault()
		return defaultConfig.glowColor
	}
	set glowColor(value: TextDisplayConfig['__glowColor']) {
		this.__glowColor = value
	}

	get invisible(): NonNullable<TextDisplayConfig['__invisible']> {
		if (this.__invisible !== undefined) return this.__invisible
		const defaultConfig = TextDisplayConfig.getDefault()
		return defaultConfig.invisible
	}
	set invisible(value: TextDisplayConfig['__invisible']) {
		this.__invisible = value
	}

	get nbt(): NonNullable<TextDisplayConfig['__nbt']> {
		if (this.__nbt !== undefined) return this.__nbt
		const defaultConfig = TextDisplayConfig.getDefault()
		return defaultConfig.nbt
	}
	set nbt(value: TextDisplayConfig['__nbt']) {
		this.__nbt = value
	}

	get shadowRadius(): NonNullable<TextDisplayConfig['__shadowRadius']> {
		if (this.__shadowRadius !== undefined) return this.__shadowRadius
		const defaultConfig = TextDisplayConfig.getDefault()
		return defaultConfig.shadowRadius
	}
	set shadowRadius(value: TextDisplayConfig['__shadowRadius']) {
		this.__shadowRadius = value
	}

	get shadowStrength(): NonNullable<TextDisplayConfig['__shadowStrength']> {
		if (this.__shadowStrength !== undefined) return this.__shadowStrength
		const defaultConfig = TextDisplayConfig.getDefault()
		return defaultConfig.shadowStrength
	}
	set shadowStrength(value: TextDisplayConfig['__shadowStrength']) {
		this.__shadowStrength = value
	}

	get useNBT(): NonNullable<TextDisplayConfig['__useNBT']> {
		if (this.__useNBT !== undefined) return this.__useNBT
		const defaultConfig = TextDisplayConfig.getDefault()
		return defaultConfig.useNBT
	}
	set useNBT(value: TextDisplayConfig['__useNBT']) {
		this.__useNBT = value
	}

	getDefault(): TextDisplayConfig {
		return TextDisplayConfig.fromJSON({
			billboard: 'center',
		})
	}

	get tickingCommands(): NonNullable<TextDisplayConfig['__billboard']> {
		if (this.__billboard !== undefined) return this.__billboard
		const defaultConfig = this.getDefault()
		return defaultConfig.tickingCommands
	}
	set tickingCommands(value: NonNullable<TextDisplayConfig['__billboard']>) {
		this.__billboard = value
	}

	toJSON(): IBlueprintTextDisplayConfigJSON {
		return scrubUndefined({
			billboard: this.__billboard,
			override_brightness: this.__overrideBrightness,
			brightness_override: this.__brightnessOverride,
			glowing: this.__glowing,
			override_glow_color: this.__overrideGlowColor,
			glow_color: this.__glowColor,
			invisible: this.__invisible,
			nbt: this.__nbt,
			shadow_radius: this.__shadowRadius,
			shadow_strength: this.__shadowStrength,
			use_nbt: this.__useNBT,
		})
	}

	static fromJSON(json: IBlueprintTextDisplayConfigJSON): TextDisplayConfig {
		const config = new TextDisplayConfig()
		if (json.billboard !== undefined) config.__billboard = json.billboard
		if (json.override_brightness !== undefined)
			config.__overrideBrightness = json.override_brightness
		if (json.brightness_override !== undefined)
			config.__brightnessOverride = json.brightness_override
		if (json.glowing !== undefined) config.__glowing = json.glowing
		if (json.override_glow_color !== undefined)
			config.__overrideGlowColor = json.override_glow_color
		if (json.glow_color !== undefined) config.__glowColor = json.glow_color
		if (json.invisible !== undefined) config.__invisible = json.invisible
		if (json.nbt !== undefined) config.__nbt = json.nbt
		if (json.shadow_radius !== undefined) config.__shadowRadius = json.shadow_radius
		if (json.shadow_strength !== undefined) config.__shadowStrength = json.shadow_strength
		if (json.use_nbt !== undefined) config.__useNBT = json.use_nbt

		return config
	}

	toNBT(compound = new NbtCompound()) {
		if (this.useNBT) {
			const newData = NbtTag.fromString(this.nbt) as NbtCompound
			for (const key of newData.keys()) {
				compound.set(key, newData.get(key)!)
			}
			return compound
		}

		if (this.__billboard) {
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

		if (this.__shadowRadius) {
			compound.set('shadow_radius', new NbtFloat(this.shadowRadius))
		}

		if (this.__shadowStrength) {
			compound.set('shadow_strength', new NbtFloat(this.shadowStrength))
		}

		return compound
	}

	isDefault(): boolean {
		return this.checkIfEqual(new TextDisplayConfig())
	}

	checkIfEqual(other: TextDisplayConfig) {
		return (
			this.__billboard === other.__billboard &&
			this.__overrideBrightness === other.__overrideBrightness &&
			this.__brightnessOverride === other.__brightnessOverride &&
			this.__glowing === other.__glowing &&
			this.__overrideGlowColor === other.__overrideGlowColor &&
			this.__glowColor === other.__glowColor &&
			this.__invisible === other.__invisible &&
			this.__nbt === other.__nbt &&
			this.__shadowRadius === other.__shadowRadius &&
			this.__shadowStrength === other.__shadowStrength &&
			this.__useNBT === other.__useNBT
		)
	}
}
